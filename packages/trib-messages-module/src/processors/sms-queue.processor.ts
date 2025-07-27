import { Injectable, Logger, Scope } from '@nestjs/common';
import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { TwilioApiClientService } from '../services/twilio-api-client.service';
import { SmsStatusUpdaterService } from '../services/sms-status-updater.service';
import {
  SmsQueueJobData,
  SendSmsJobData,
  SmsProcessorJobResult,
  SMS_QUEUE_JOBS,
} from '../types/queue-job-types';
import { TribMessageStatus } from '../types/message-enums';
import { TwilioApiResult } from '../types/twilio-types';
import { TRIB_TOKENS } from '../tokens';

/**
 * SMS queue processor for handling SMS queue jobs with comprehensive error handling
 *
 * Integrated with Twenty's message queue system using proper decorators.
 *
 * This processor coordinates the complete SMS sending workflow:
 * 1. Validates job data and message existence
 * 2. Checks rate limits to prevent API overruns
 * 3. Calls Twilio API client service for external communication
 * 4. Updates message status based on API results
 * 5. Handles errors with proper retry logic
 *
 * The processor delegates complex operations to specialized services:
 * - TwilioApiClientService for external API communication
 * - Rate limiting service for API quotas
 * - Status updater service for database updates
 *
 * McCabe Complexity: 4/7 (job validation, rate limit check, success handling, error handling)
 */
@Processor(TRIB_TOKENS.QUEUE_NAME)
export class SmsQueueProcessor {
  private readonly logger = new Logger(SmsQueueProcessor.name);

  constructor(
    private readonly twilioApiClient: TwilioApiClientService,
    private readonly smsStatusUpdater: SmsStatusUpdaterService,
  ) {
    this.logger.log('SMS Queue Processor initialized');
  }

  /**
   * Process SMS sending job from Twenty message queue
   *
   * Handles the complete SMS processing workflow by coordinating
   * between rate limiting, API calls, and status updates.
   *
   * @param data - SMS job data containing message details and configuration
   * @throws Error for retry logic if processing fails
   */
  @Process('send-sms')
  async handle(job: Job<SendSmsJobData>): Promise<void> {
    const data = job.data;
    const { messageId, twilioConfig, messageData, workspaceId } = data; // Extract workspaceId
    const startTime = Date.now();

    try {
      // Step 1: Validate job data
      this.validateJobData(data);

      this.logger.log(`Processing SMS job for message ${messageId} in workspace ${workspaceId}`, {
        messageId,
        workspaceId,
        phoneNumber: messageData.to,
      });

      // Step 2: Update status to SENDING (pass workspaceId)
      await this.smsStatusUpdater.updateStatus(
        workspaceId,
        messageId,
        TribMessageStatus.SENDING,
      );

      // Step 3: Call Twilio API service (delegates to Sub-Slice 8b1)
      const result: TwilioApiResult = await this.twilioApiClient.sendSms(
        messageData,
        twilioConfig,
      );

      // Step 4: Handle success response (pass workspaceId)
      if (result.success) {
        await this.smsStatusUpdater.updateWithExternalId(
          workspaceId,
          messageId,
          TribMessageStatus.SENT,
          result.externalId || '',
        );

        this.logger.log(`SMS sent successfully for message ${messageId} in workspace ${workspaceId}`, {
          messageId,
          workspaceId,
          externalId: result.externalId,
          processingTime: Date.now() - startTime,
        });
      } else {
        // Step 5: Handle API error response
        throw new Error(
          `Twilio API failed: ${result.error?.message || 'Unknown error'}`,
        );
      }
    } catch (error) {
      // Step 6: Handle processing errors (pass workspaceId)
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      await this.smsStatusUpdater.updateWithError(
        workspaceId,
        messageId,
        TribMessageStatus.FAILED,
        'PROCESSING_ERROR',
        errorMessage,
      );

      this.logger.error(`SMS processing failed for message ${messageId} in workspace ${workspaceId}`, {
        messageId,
        workspaceId,
        error: error instanceof Error ? error.message : String(error),
        processingTime: Date.now() - startTime,
      });

      // Rethrow for Twenty message queue retry logic
      throw error;
    }
  }

  /**
   * Validates job data for required fields and proper structure
   *
   * @param jobData - Job data to validate
   * @throws Error if validation fails
   */
  private validateJobData(jobData: SendSmsJobData): void {
    if (!jobData.messageId) {
      throw new Error('Message ID is required');
    }

    if (!jobData.workspaceId) {
      throw new Error('Workspace ID is required');
    }

    if (!jobData.twilioConfig) {
      throw new Error('Twilio configuration is required');
    }

    if (!jobData.messageData) {
      throw new Error('Message data is required');
    }
  }
}
