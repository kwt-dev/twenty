import {
  TwilioMessageResponse,
  TwilioMessageStatus,
} from '../utils/twilio/twilio-client-factory';

/**
 * Standardized result interface for all Twilio API operations
 *
 * This interface provides a consistent return format for all Twilio API calls,
 * enabling predictable error handling and result processing throughout the system.
 */
export interface TwilioApiResult {
  /** Operation success flag */
  success: boolean;

  /** Twilio message SID (if successful) */
  externalId?: string;

  /** Current message status from Twilio */
  status?: TwilioMessageStatus;

  /** Error information (if failed) */
  error?: TwilioError;

  /** Whether the operation should be retried */
  retryable?: boolean;

  /** Raw Twilio response (for debugging) */
  rawResponse?: TwilioMessageResponse;
}

/**
 * Standardized error structure for Twilio operations
 *
 * Provides detailed error information with classification to enable
 * intelligent retry logic and appropriate error handling.
 */
export interface TwilioError {
  /** Error type classification */
  type: TwilioErrorType;

  /** Human-readable error message */
  message: string;

  /** Twilio error code (if available) */
  code?: string;

  /** HTTP status code from Twilio API */
  statusCode?: number;

  /** Whether this error type should trigger a retry */
  retryable: boolean;

  /** Suggested delay before retry (in milliseconds) */
  retryDelay?: number;
}

/**
 * Classification of Twilio error types for intelligent handling
 */
export enum TwilioErrorType {
  /** Authentication or authorization failures */
  AUTHENTICATION = 'AUTHENTICATION',

  /** Invalid phone numbers or validation failures */
  VALIDATION = 'VALIDATION',

  /** Rate limiting or quota exceeded */
  RATE_LIMIT = 'RATE_LIMIT',

  /** Network timeouts or connectivity issues */
  NETWORK = 'NETWORK',

  /** Twilio service unavailable */
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',

  /** Unknown or unexpected errors */
  UNKNOWN = 'UNKNOWN',
}

/**
 * Retry configuration for Twilio API calls
 *
 * Defines retry behavior including exponential backoff parameters
 * and maximum retry attempts for different error types.
 */
export interface TwilioRetryConfig {
  /** Maximum number of retry attempts */
  maxRetries: number;

  /** Initial retry delay in milliseconds */
  initialDelay: number;

  /** Exponential backoff multiplier */
  backoffMultiplier: number;

  /** Maximum delay between retries */
  maxDelay: number;

  /** Error types that should trigger retries */
  retryableErrors: TwilioErrorType[];
}

/**
 * Default retry configuration with conservative settings
 */
export const DEFAULT_TWILIO_RETRY_CONFIG: TwilioRetryConfig = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  backoffMultiplier: 2,
  maxDelay: 30000, // 30 seconds
  retryableErrors: [
    TwilioErrorType.RATE_LIMIT,
    TwilioErrorType.NETWORK,
    TwilioErrorType.SERVICE_UNAVAILABLE,
  ],
};

/**
 * Twilio API operation context for logging and tracking
 */
export interface TwilioOperationContext {
  /** Operation type for logging */
  operation: string;

  /** Message ID for correlation */
  messageId?: string;

  /** Attempt number for retry tracking */
  attemptNumber: number;

  /** Start time for performance tracking */
  startTime: Date;

  /** Workspace ID for context */
  workspaceId?: string;
}
