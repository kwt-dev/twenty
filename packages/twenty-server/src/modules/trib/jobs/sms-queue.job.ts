import { Injectable } from '@nestjs/common';
import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { 
  SmsStatusUpdaterService, 
  TwilioApiClientService,
  SendSmsJobData,
  TribMessageStatus,
  TwilioApiResult 
} from '@twenty/trib-messages-module';

@Processor(MessageQueue.messagingQueue)
@Injectable()
export class SmsQueueJob {
  constructor(
    private readonly smsStatusUpdater: SmsStatusUpdaterService,
    private readonly twilioApiClient: TwilioApiClientService,
  ) {}

  @Process('send-sms')
  async handle(data: SendSmsJobData): Promise<void> {
    const { messageId, twilioConfig, messageData, workspaceId } = data;
    
    try {
      // Update status to SENDING
      await this.smsStatusUpdater.updateStatus(
        workspaceId,
        messageId,
        TribMessageStatus.SENDING,
      );

      // Call Twilio API
      const result: TwilioApiResult = await this.twilioApiClient.sendSms(
        messageData,
        twilioConfig,
      );

      // Handle success
      if (result.success) {
        await this.smsStatusUpdater.updateWithExternalId(
          workspaceId,
          messageId,
          TribMessageStatus.SENT,
          result.externalId || '',
        );
      } else {
        throw new Error(
          `Twilio API failed: ${result.error?.message || 'Unknown error'}`,
        );
      }
    } catch (error) {
      // Handle errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.smsStatusUpdater.updateWithError(
        workspaceId,
        messageId,
        TribMessageStatus.FAILED,
        'PROCESSING_ERROR',
        errorMessage,
      );
      
      throw error; // Re-throw for Twenty's retry logic
    }
  }
}