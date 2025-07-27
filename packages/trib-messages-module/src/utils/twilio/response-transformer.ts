import { Injectable, Logger } from '@nestjs/common';
import {
  TwilioMessageResponse,
  TwilioMessageStatus,
} from './twilio-client-factory';
import {
  TwilioApiResult,
  TwilioError,
  TwilioErrorType,
  DEFAULT_TWILIO_RETRY_CONFIG,
} from '../../types/twilio-types';

/**
 * Service for transforming Twilio API responses into standardized formats
 *
 * This service handles the conversion of raw Twilio responses and errors
 * into the standardized TwilioApiResult format used throughout the system.
 * It includes intelligent error classification and retry determination.
 */
@Injectable()
export class TwilioResponseTransformerService {
  private readonly logger = new Logger(TwilioResponseTransformerService.name);

  /**
   * Transforms a successful Twilio message response into standardized format
   *
   * @param response - Raw Twilio message response
   * @returns Standardized success result
   */
  transformSuccess(response: TwilioMessageResponse): TwilioApiResult {
    this.logger.log(`Transforming successful Twilio response: ${response.sid}`);

    return {
      success: true,
      externalId: response.sid,
      status: response.status,
      rawResponse: response,
    };
  }

  /**
   * Transforms a Twilio error into standardized format with retry logic
   *
   * @param error - Raw error from Twilio API call
   * @returns Standardized error result with retry information
   */
  transformError(error: any): TwilioApiResult {
    this.logger.error(
      `Transforming Twilio error: ${error.message || error.toString()}`,
    );

    const twilioError = this.classifyError(error);

    return {
      success: false,
      error: twilioError,
      retryable: twilioError.retryable,
    };
  }

  /**
   * Classifies errors into types with appropriate retry logic
   *
   * @param error - Raw error object
   * @returns Classified Twilio error with retry information
   */
  private classifyError(error: any): TwilioError {
    const statusCode = error.statusCode || error.status || 0;
    const errorCode = error.errorCode || error.code;
    const message = error.message || error.toString();

    // Authentication errors (HTTP 401, 403)
    if (statusCode === 401 || statusCode === 403) {
      return {
        type: TwilioErrorType.AUTHENTICATION,
        message: 'Authentication or authorization failed',
        code: errorCode,
        statusCode,
        retryable: false,
      };
    }

    // Rate limiting (HTTP 429 or specific Twilio error codes)
    if (statusCode === 429 || this.isRateLimitError(errorCode)) {
      const retryDelay = this.calculateRateLimitDelay(error);
      return {
        type: TwilioErrorType.RATE_LIMIT,
        message: 'Rate limit exceeded',
        code: errorCode,
        statusCode,
        retryable: true,
        retryDelay,
      };
    }

    // Validation errors (HTTP 400 or specific validation codes)
    if (statusCode === 400 || this.isValidationError(errorCode)) {
      return {
        type: TwilioErrorType.VALIDATION,
        message: this.getValidationErrorMessage(errorCode, message),
        code: errorCode,
        statusCode,
        retryable: false,
      };
    }

    // Network/timeout errors
    if (this.isNetworkError(error)) {
      return {
        type: TwilioErrorType.NETWORK,
        message: 'Network error or timeout',
        code: errorCode,
        statusCode,
        retryable: true,
        retryDelay: DEFAULT_TWILIO_RETRY_CONFIG.initialDelay,
      };
    }

    // Service unavailable (HTTP 5xx)
    if (statusCode >= 500 && statusCode < 600) {
      return {
        type: TwilioErrorType.SERVICE_UNAVAILABLE,
        message: 'Twilio service temporarily unavailable',
        code: errorCode,
        statusCode,
        retryable: true,
        retryDelay: DEFAULT_TWILIO_RETRY_CONFIG.initialDelay * 2,
      };
    }

    // Unknown errors
    return {
      type: TwilioErrorType.UNKNOWN,
      message: message || 'Unknown error occurred',
      code: errorCode,
      statusCode,
      retryable: true,
      retryDelay: DEFAULT_TWILIO_RETRY_CONFIG.initialDelay,
    };
  }

  /**
   * Checks if error code indicates rate limiting
   */
  private isRateLimitError(errorCode: string): boolean {
    const rateLimitCodes = ['20429', '20003', '20004'];
    return rateLimitCodes.includes(errorCode);
  }

  /**
   * Checks if error code indicates validation failure
   */
  private isValidationError(errorCode: string): boolean {
    const validationCodes = [
      '21211', // Invalid 'To' phone number
      '21212', // Invalid 'From' phone number
      '21610', // Message exceeds character limit
      '21614', // 'To' number is not a valid mobile number
    ];
    return validationCodes.includes(errorCode);
  }

  /**
   * Checks if error is network-related
   */
  private isNetworkError(error: any): boolean {
    if (
      error.code === 'ECONNRESET' ||
      error.code === 'ECONNREFUSED' ||
      error.code === 'ETIMEDOUT'
    ) {
      return true;
    }

    if (error.message && error.message.toLowerCase().includes('timeout')) {
      return true;
    }

    return false;
  }

  /**
   * Calculates retry delay for rate limit errors
   */
  private calculateRateLimitDelay(error: any): number {
    // Check for Retry-After header
    if (error.headers && error.headers['retry-after']) {
      const retryAfter = parseInt(error.headers['retry-after'], 10);
      if (!isNaN(retryAfter)) {
        return retryAfter * 1000; // Convert seconds to milliseconds
      }
    }

    // Default exponential backoff for rate limits
    return DEFAULT_TWILIO_RETRY_CONFIG.initialDelay * 3; // 3 seconds for rate limits
  }

  /**
   * Gets user-friendly validation error messages
   */
  private getValidationErrorMessage(
    errorCode: string,
    originalMessage: string,
  ): string {
    const errorMessages: Record<string, string> = {
      '21211': 'Invalid recipient phone number format',
      '21212': 'Invalid sender phone number format',
      '21610': 'Message content exceeds maximum length',
      '21614': 'Recipient number is not a valid mobile number',
    };

    return errorMessages[errorCode] || originalMessage || 'Validation error';
  }

  /**
   * Determines if an operation should be retried based on error type and attempt count
   *
   * @param error - Twilio error information
   * @param attemptNumber - Current attempt number (1-based)
   * @returns Whether the operation should be retried
   */
  shouldRetry(error: TwilioError, attemptNumber: number): boolean {
    if (!error.retryable) {
      return false;
    }

    if (attemptNumber > DEFAULT_TWILIO_RETRY_CONFIG.maxRetries) {
      return false;
    }

    return DEFAULT_TWILIO_RETRY_CONFIG.retryableErrors.includes(error.type);
  }

  /**
   * Calculates the next retry delay using exponential backoff
   *
   * @param attemptNumber - Current attempt number (1-based)
   * @param baseDelay - Base delay from error (optional)
   * @returns Delay in milliseconds before next retry
   */
  calculateRetryDelay(attemptNumber: number, baseDelay?: number): number {
    const config = DEFAULT_TWILIO_RETRY_CONFIG;
    const delay = baseDelay || config.initialDelay;

    const exponentialDelay =
      delay * Math.pow(config.backoffMultiplier, attemptNumber - 1);

    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.1 * exponentialDelay;

    const finalDelay = Math.min(exponentialDelay + jitter, config.maxDelay);

    this.logger.debug(
      `Calculated retry delay for attempt ${attemptNumber}: ${finalDelay}ms`,
    );

    return Math.floor(finalDelay);
  }
}
