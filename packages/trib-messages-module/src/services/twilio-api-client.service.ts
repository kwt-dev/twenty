import { Injectable, Logger } from '@nestjs/common';
import {
  CreateSmsMessageDto,
  TwilioConfigDto,
} from '../dto/create-message.dto';
import {
  createTwilioClient,
  TwilioClient,
  TwilioMessageParams,
} from '../utils/twilio/twilio-client-factory';
import { TwilioResponseTransformerService } from '../utils/twilio/response-transformer';
import {
  TwilioApiResult,
  TwilioOperationContext,
  DEFAULT_TWILIO_RETRY_CONFIG,
} from '../types/twilio-types';

/**
 * Service for handling all Twilio API communication with comprehensive error handling
 *
 * This service provides a clean abstraction over the Twilio API with:
 * - Standardized error handling and classification
 * - Intelligent retry logic with exponential backoff
 * - Comprehensive logging and monitoring
 * - Response transformation to internal formats
 * - Timeout and rate limit handling
 *
 * The service is designed to be used by queue processors and other services
 * that need to interact with the Twilio API without dealing with API complexity.
 */
@Injectable()
export class TwilioApiClientService {
  private readonly logger = new Logger(TwilioApiClientService.name);

  constructor(
    private readonly responseTransformer: TwilioResponseTransformerService,
  ) {
    this.logger.log('TwilioApiClientService initialized');
  }

  /**
   * Sends an SMS message via Twilio API with comprehensive error handling
   *
   * This method handles the complete SMS sending workflow:
   * 1. Creates authenticated Twilio client
   * 2. Transforms message data to Twilio format
   * 3. Executes API call with timeout handling
   * 4. Transforms response to standardized format
   * 5. Classifies errors for retry logic
   *
   * @param messageData - SMS message content and metadata
   * @param twilioConfig - Twilio API configuration
   * @param context - Operation context for logging and tracking
   * @returns Standardized API result with success/error information
   */
  async sendSms(
    messageData: CreateSmsMessageDto,
    twilioConfig: TwilioConfigDto,
    context?: Partial<TwilioOperationContext>,
  ): Promise<TwilioApiResult> {
    const operationContext: TwilioOperationContext = {
      operation: 'sendSms',
      messageId: context?.messageId,
      attemptNumber: context?.attemptNumber || 1,
      startTime: new Date(),
      workspaceId: context?.workspaceId || messageData.workspaceId,
    };

    this.logger.log(
      `Starting SMS send operation for message ${operationContext.messageId || 'unknown'} ` +
        `(attempt ${operationContext.attemptNumber})`,
    );

    try {
      // Step 1: Create Twilio client with validation
      const twilioClient = this.createTwilioClientWithValidation(twilioConfig);

      // Step 2: Transform message data to Twilio format
      const twilioParams = this.transformMessageToTwilioFormat(
        messageData,
        twilioConfig,
      );

      // Step 3: Execute API call with timeout
      const response = await this.executeApiCallWithTimeout(
        twilioClient,
        twilioParams,
        twilioConfig.timeout || DEFAULT_TWILIO_RETRY_CONFIG.maxDelay,
      );

      // Step 4: Transform successful response
      const result = this.responseTransformer.transformSuccess(response);

      this.logOperationSuccess(operationContext, result);
      return result;
    } catch (error) {
      // Step 5: Handle and transform errors
      const result = this.responseTransformer.transformError(error);

      this.logOperationError(operationContext, error, result);
      return result;
    }
  }

  /**
   * Retrieves message status from Twilio by SID
   *
   * @param messageSid - Twilio message SID
   * @param twilioConfig - Twilio API configuration
   * @param context - Operation context for logging
   * @returns Standardized API result with message status
   */
  async getMessageStatus(
    messageSid: string,
    twilioConfig: TwilioConfigDto,
    context?: Partial<TwilioOperationContext>,
  ): Promise<TwilioApiResult> {
    const operationContext: TwilioOperationContext = {
      operation: 'getMessageStatus',
      messageId: context?.messageId,
      attemptNumber: context?.attemptNumber || 1,
      startTime: new Date(),
      workspaceId: context?.workspaceId,
    };

    this.logger.log(
      `Fetching message status for SID: ${messageSid} ` +
        `(attempt ${operationContext.attemptNumber})`,
    );

    try {
      const twilioClient = this.createTwilioClientWithValidation(twilioConfig);

      const response = await Promise.race([
        twilioClient.messages.fetch(messageSid),
        this.createTimeoutPromise(twilioConfig.timeout || 30000),
      ]);

      const result = this.responseTransformer.transformSuccess(response);
      this.logOperationSuccess(operationContext, result);
      return result;
    } catch (error) {
      const result = this.responseTransformer.transformError(error);
      this.logOperationError(operationContext, error, result);
      return result;
    }
  }

  /**
   * Creates and validates Twilio client instance
   *
   * @param config - Twilio configuration
   * @returns Configured Twilio client
   * @throws Error if configuration is invalid
   */
  private createTwilioClientWithValidation(
    config: TwilioConfigDto,
  ): TwilioClient {
    try {
      return createTwilioClient(config);
    } catch (error) {
      this.logger.error('Failed to create Twilio client', error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Twilio client creation failed: ${errorMessage}`);
    }
  }

  /**
   * Transforms internal message format to Twilio API parameters
   *
   * @param messageData - Internal message data
   * @param config - Twilio configuration
   * @returns Twilio API parameters
   */
  private transformMessageToTwilioFormat(
    messageData: CreateSmsMessageDto,
    config: TwilioConfigDto,
  ): TwilioMessageParams {
    const params: TwilioMessageParams = {
      body: messageData.content,
      from: messageData.from || config.phoneNumber,
      to: messageData.to,
    };

    // Add optional webhook URL for status callbacks
    if (config.webhookUrl) {
      params.statusCallback = config.webhookUrl;
    }

    // Add metadata as JSON string if present
    if (messageData.metadata) {
      // Note: Twilio doesn't support custom metadata directly,
      // but we can store it in the client-side for correlation
      this.logger.debug(
        `Message metadata: ${JSON.stringify(messageData.metadata)}`,
      );
    }

    this.logger.debug(
      `Transformed message parameters: ${JSON.stringify(params, null, 2)}`,
    );
    return params;
  }

  /**
   * Executes Twilio API call with timeout handling
   *
   * @param client - Twilio client instance
   * @param params - API call parameters
   * @param timeoutMs - Timeout in milliseconds
   * @returns Twilio message response
   */
  private async executeApiCallWithTimeout(
    client: TwilioClient,
    params: TwilioMessageParams,
    timeoutMs: number,
  ) {
    this.logger.debug(`Executing Twilio API call with ${timeoutMs}ms timeout`);

    const apiCall = client.messages.create(params);
    const timeoutPromise = this.createTimeoutPromise(timeoutMs);

    return Promise.race([apiCall, timeoutPromise]);
  }

  /**
   * Creates a timeout promise that rejects after specified milliseconds
   *
   * @param timeoutMs - Timeout in milliseconds
   * @returns Promise that rejects with timeout error
   */
  private createTimeoutPromise(timeoutMs: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Twilio API call timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });
  }

  /**
   * Logs successful operation completion
   *
   * @param context - Operation context
   * @param result - API result
   */
  private logOperationSuccess(
    context: TwilioOperationContext,
    result: TwilioApiResult,
  ): void {
    const duration = Date.now() - context.startTime.getTime();

    this.logger.log(
      `${context.operation} completed successfully in ${duration}ms - ` +
        `External ID: ${result.externalId}, Status: ${result.status}`,
    );
  }

  /**
   * Logs operation error with detailed information
   *
   * @param context - Operation context
   * @param error - Original error
   * @param result - Transformed error result
   */
  private logOperationError(
    context: TwilioOperationContext,
    error: any,
    result: TwilioApiResult,
  ): void {
    const duration = Date.now() - context.startTime.getTime();

    this.logger.error(
      `${context.operation} failed after ${duration}ms - ` +
        `Error Type: ${result.error?.type}, Retryable: ${result.retryable}, ` +
        `Attempt: ${context.attemptNumber}`,
      error,
    );
  }

  /**
   * Validates if retry should be attempted for a failed operation
   *
   * @param result - Previous attempt result
   * @param attemptNumber - Current attempt number
   * @returns Whether retry should be attempted
   */
  shouldRetryOperation(
    result: TwilioApiResult,
    attemptNumber: number,
  ): boolean {
    if (!result.error) {
      return false;
    }

    return this.responseTransformer.shouldRetry(result.error, attemptNumber);
  }

  /**
   * Calculates delay before next retry attempt
   *
   * @param attemptNumber - Current attempt number
   * @param lastResult - Previous attempt result
   * @returns Delay in milliseconds
   */
  calculateRetryDelay(
    attemptNumber: number,
    lastResult?: TwilioApiResult,
  ): number {
    const baseDelay = lastResult?.error?.retryDelay;
    return this.responseTransformer.calculateRetryDelay(
      attemptNumber,
      baseDelay,
    );
  }
}
