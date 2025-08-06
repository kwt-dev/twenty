// This would normally be: import { MessageQueueJobData } from 'src/engine/core-modules/message-queue/interfaces/message-queue-job.interface';
// For this module, we'll use a simple interface that matches Twenty's pattern
interface MessageQueueJobData {
  [key: string]: any;
}
import {
  CreateSmsMessageDto,
  TwilioConfigDto,
} from '@twenty/trib-messages-module';

/**
 * SMS queue job data interface for asynchronous SMS processing
 *
 * This interface defines the data structure for SMS jobs that are
 * queued for asynchronous processing outside of database transactions.
 * This pattern prevents long-running external API calls from blocking
 * database connections and improves overall system performance.
 */
export interface SmsQueueJobData extends MessageQueueJobData {
  /** Unique identifier of the message record in database */
  messageId: string;

  /** Twilio configuration for API calls */
  twilioConfig: TwilioConfigDto;

  /** Original message data for processing */
  messageData: CreateSmsMessageDto;

  /** Workspace ID for context isolation */
  workspaceId: string;

  /** Optional retry attempt number for tracking */
  retryAttempt?: number;
}

/**
 * Standard SMS queue job names for consistency
 */
export const SMS_QUEUE_JOBS = {
  SEND_SMS: 'send-sms',
  RETRY_SMS: 'retry-sms',
} as const;

export type SmsQueueJobName =
  (typeof SMS_QUEUE_JOBS)[keyof typeof SMS_QUEUE_JOBS];

/**
 * Extended job data interface for queue processor integration
 *
 * This interface extends the basic SmsQueueJobData with additional
 * fields that may be needed by the queue processor for job handling,
 * retry logic, and error tracking.
 */
export interface SendSmsJobData extends SmsQueueJobData {
  /** Job processing priority (1-10, higher = more urgent) */
  priority?: number;

  /** Maximum number of retry attempts */
  maxAttempts?: number;

  /** Delay between retries in milliseconds */
  retryDelay?: number;

  /** Job timeout in milliseconds */
  timeoutMs?: number;

  /** Additional context for job processing */
  context?: {
    /** Source system or component that created the job */
    source?: string;

    /** Correlation ID for tracking across services */
    correlationId?: string;

    /** User ID who initiated the message */
    userId?: string;
  };
}

/**
 * Queue processor job result interface
 *
 * Standardized result format for queue processor operations
 * to ensure consistent error handling and logging.
 */
export interface SmsProcessorJobResult {
  /** Whether the job processing was successful */
  success: boolean;

  /** Message ID that was processed */
  messageId: string;

  /** External ID from Twilio (if successful) */
  externalId?: string;

  /** Error details (if failed) */
  error?: {
    /** Error message */
    message: string;

    /** Error code from Twilio or internal system */
    code?: string;

    /** Whether this error is retryable */
    retryable: boolean;
  };

  /** Processing time in milliseconds */
  processingTime?: number;

  /** Number of retry attempts made */
  attemptsMade?: number;
}
