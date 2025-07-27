import {
  Controller,
  Post,
  Body,
  Headers,
  Req,
  Res,
  HttpStatus,
  Logger,
  BadRequestException,
  InternalServerErrorException,
  Inject,
  Param,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { TRIB_TOKENS } from '../tokens';
import { TwilioSignatureValidationMiddleware } from '../middleware/twilio-signature-validation.middleware';
import {
  TwilioWebhookPayloadSchema,
  TwilioWebhookPayload,
  mapTwilioStatusToDeliveryStatus,
  isDeliveryStatusUpdate,
  extractErrorInfo,
  WebhookProcessResult,
  getStatusFromWebhook,
} from '../dto/twilio-webhook.dto';
import { ITribDeliveryRepository } from '../interfaces/trib-delivery.repository.interface';
import { ITribMessageRepository } from '../interfaces/trib-message.repository.interface';
import { TribSmsService } from '../services/trib_sms.service';

/**
 * Controller for handling Twilio webhook callbacks for delivery status updates.
 *
 * Features:
 * - Repository abstraction using DI tokens (no workspace entity dependencies)
 * - Mandatory signature validation via middleware
 * - Delivery status tracking and updates
 * - Duplicate webhook prevention
 * - Comprehensive error handling
 */
@Controller('webhooks/trib/twilio')
export class TribWebhookController {
  private readonly logger = new Logger(TribWebhookController.name);

  constructor(
    @Inject(TRIB_TOKENS.DELIVERY_REPOSITORY)
    private readonly deliveryRepository: ITribDeliveryRepository,

    @Inject(TRIB_TOKENS.MESSAGE_REPOSITORY)
    private readonly messageRepository: ITribMessageRepository,

    private readonly tribSmsService: TribSmsService,
  ) {}

  /**
   * Handles incoming SMS messages from Twilio.
   *
   * @param payload - Webhook payload from Twilio (validated by middleware)
   * @param signature - X-Twilio-Signature header (validated by middleware)
   * @param req - Express request object
   * @param res - Express response object
   */
  @Post(':workspaceId/incoming-message')
  async handleIncomingMessage(
    @Param('workspaceId') workspaceId: string,
    @Body() payload: unknown,
    @Headers('x-twilio-signature') signature: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    try {
      // Validate webhook payload structure
      const webhookData = this.validateWebhookPayload(payload);

      this.logger.log('Processing incoming SMS message', {
        messageSid: webhookData.MessageSid,
        from: webhookData.From,
        to: webhookData.To,
        workspaceId: workspaceId,
        body: webhookData.Body?.substring(0, 50) + '...',
      });

      // Only process received messages at this endpoint
      if (webhookData.SmsStatus !== 'received') {
        this.logger.debug('Webhook is not a received message, ignoring', {
          messageSid: webhookData.MessageSid,
          status: webhookData.SmsStatus,
        });
        res
          .status(HttpStatus.OK)
          .json({ message: 'Webhook ignored - not a received message' });
        return;
      }

      // Process the incoming message with phone matching
      const result = await this.processIncomingMessage(
        webhookData,
        workspaceId,
      );

      // Return success response
      res.status(HttpStatus.OK).json({
        messageProcessed: result.success,
        messageId: result.messageId,
        personMatched: result.contactId !== null,
        contactId: result.contactId,
        processedAt: new Date(),
      });
    } catch (error) {
      this.logger.error('Error processing incoming SMS webhook', {
        error: error instanceof Error ? error.message : String(error),
        payload: payload,
      });

      if (error instanceof BadRequestException) {
        res.status(HttpStatus.BAD_REQUEST).json({
          error: error.message,
          httpStatus: HttpStatus.BAD_REQUEST,
          timestamp: new Date(),
        });
        return;
      }

      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'Internal server error processing incoming message',
        httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Handles Twilio SMS delivery status webhooks.
   *
   * @param payload - Webhook payload from Twilio (validated by middleware)
   * @param signature - X-Twilio-Signature header (validated by middleware)
   * @param req - Express request object
   * @param res - Express response object
   * @returns WebhookProcessResult or error response
   */
  @Post(':workspaceId/delivery-status')
  async handleDeliveryStatus(
    @Param('workspaceId') workspaceId: string,
    @Body() payload: unknown,
    @Headers('x-twilio-signature') signature: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    try {
      // Validate webhook payload structure
      const webhookData = this.validateWebhookPayload(payload);

      // Defensive check: if this is an incoming message, it's misconfigured
      if (webhookData.SmsStatus === 'received') {
        this.logger.warn(
          'Incoming message webhook incorrectly routed to delivery-status endpoint. Please update Twilio webhook URL configuration.',
          { 
            messageSid: webhookData.MessageSid,
            from: webhookData.From,
            correctEndpoint: 'Use /:workspaceId/incoming-message instead'
          },
        );
        res.status(HttpStatus.OK).json({ 
          message: 'Webhook misconfigured - incoming messages should use /:workspaceId/incoming-message endpoint',
          redirectRequired: true
        });
        return;
      }

      const status = getStatusFromWebhook(webhookData);

      this.logger.log('Processing Twilio delivery status webhook', {
        messageSid: webhookData.MessageSid,
        status: status,
        to: webhookData.To,
      });

      // Check if this is actually a delivery status update
      if (!isDeliveryStatusUpdate(webhookData)) {
        this.logger.debug('Webhook is not a delivery status update, ignoring', {
          messageSid: webhookData.MessageSid,
          status: status,
        });
        res
          .status(HttpStatus.OK)
          .json({ message: 'Webhook ignored - not a delivery status' });
        return;
      }

      // Process the delivery status update
      const result = await this.processDeliveryStatusUpdate(webhookData);

      // Return success response
      res.status(HttpStatus.OK).json({
        statusUpdated: result.statusUpdated,
        deliveryId: result.deliveryId,
        newStatus: result.newStatus,
        processedAt: result.processedAt,
      });
    } catch (error) {
      this.logger.error('Error processing Twilio webhook', {
        error: error instanceof Error ? error.message : String(error),
        payload: payload,
      });

      if (error instanceof BadRequestException) {
        res.status(HttpStatus.BAD_REQUEST).json({
          error: error.message,
          httpStatus: HttpStatus.BAD_REQUEST,
          timestamp: new Date(),
        });
        return;
      }

      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'Internal server error processing webhook',
        httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Validates the webhook payload structure and content.
   *
   * @param payload - Raw webhook payload
   * @returns Validated TwilioWebhookPayload
   * @throws BadRequestException if payload is invalid
   */
  private validateWebhookPayload(payload: unknown): TwilioWebhookPayload {
    try {
      return TwilioWebhookPayloadSchema.parse(payload);
    } catch (error) {
      this.logger.warn('Invalid webhook payload received', {
        error: error instanceof Error ? error.message : String(error),
        payload,
      });
      throw new BadRequestException('Invalid webhook payload structure');
    }
  }

  /**
   * Processes delivery status update from Twilio webhook.
   *
   * @param webhookData - Validated webhook payload
   * @returns WebhookProcessResult with update details
   * @throws InternalServerErrorException if processing fails
   */
  private async processDeliveryStatusUpdate(
    webhookData: TwilioWebhookPayload,
  ): Promise<WebhookProcessResult> {
    try {
      // Find the delivery record by Twilio message SID
      const delivery = await this.deliveryRepository.findByExternalId(
        webhookData.MessageSid,
      );

      if (!delivery) {
        this.logger.warn('Delivery record not found for webhook', {
          messageSid: webhookData.MessageSid,
        });
        throw new BadRequestException(
          `Delivery record not found for message ${webhookData.MessageSid}`,
        );
      }

      // Map Twilio status to internal status
      const webhookStatus = getStatusFromWebhook(webhookData);
      const newStatus = mapTwilioStatusToDeliveryStatus(webhookStatus);
      const previousStatus = delivery.status;

      // Check for duplicate webhook (same status)
      if (delivery.status === newStatus) {
        this.logger.debug('Duplicate webhook received - status unchanged', {
          messageSid: webhookData.MessageSid,
          currentStatus: delivery.status,
        });

        return {
          statusUpdated: false,
          deliveryId: delivery.id,
          previousStatus,
          newStatus,
          processedAt: new Date(),
        };
      }

      // Extract error information if delivery failed
      const errorInfo = extractErrorInfo(webhookData);

      // Prepare update data
      const updateData: any = {
        status: newStatus,
        updatedAt: new Date(),
      };

      // Add error information if present
      if (errorInfo.hasError) {
        updateData.errorCode = errorInfo.errorCode;
        updateData.errorMessage = errorInfo.errorMessage;
        updateData.failedAt = new Date();
      }

      // If delivery succeeded, set deliveredAt
      if (newStatus === 'DELIVERED') {
        updateData.deliveredAt = new Date();
      }

      // Update delivery status and error details
      await this.deliveryRepository.update(delivery.id, updateData);

      this.logger.log('Delivery status updated successfully', {
        deliveryId: delivery.id,
        messageSid: webhookData.MessageSid,
        previousStatus,
        newStatus,
        hasError: errorInfo.hasError,
      });

      return {
        statusUpdated: true,
        deliveryId: delivery.id,
        previousStatus,
        newStatus,
        processedAt: new Date(),
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error('Failed to process delivery status update', {
        messageSid: webhookData.MessageSid,
        error: error instanceof Error ? error.message : String(error),
      });

      throw new InternalServerErrorException(
        'Failed to update delivery status',
      );
    }
  }

  /**
   * Processes incoming SMS message with phone number matching.
   *
   * @param webhookData - Validated webhook payload
   * @returns Processing result with message and contact info
   * @throws InternalServerErrorException if processing fails
   */
  private async processIncomingMessage(
    webhookData: TwilioWebhookPayload,
    workspaceId: string,
  ): Promise<{
    success: boolean;
    messageId?: string;
    contactId?: string | null;
  }> {
    try {
      const success = await this.tribSmsService.processInboundSMS(
        {
          From: webhookData.From || '',
          To: webhookData.To || '',
          Body: webhookData.Body || '',
          MessageSid: webhookData.MessageSid,
          AccountSid: webhookData.AccountSid || '',
        },
        workspaceId,
      );

      if (success) {
        // Try to find the created message to get its ID and contact info
        const createdMessage = await this.messageRepository.findByExternalId(
          webhookData.MessageSid,
        );

        return {
          success: true,
          messageId: createdMessage?.id,
          contactId: createdMessage?.contactId,
        };
      }

      return { success: false };
    } catch (error) {
      this.logger.error('Failed to process incoming SMS message', {
        messageSid: webhookData.MessageSid,
        error: error instanceof Error ? error.message : String(error),
      });

      throw new InternalServerErrorException(
        'Failed to process incoming message',
      );
    }
  }
}
