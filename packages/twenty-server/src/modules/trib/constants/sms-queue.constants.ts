/**
 * SMS Queue Constants
 *
 * Defines constants for SMS queue integration with Twenty's message queue system.
 * These constants should be registered with the main MessageQueue enum when
 * the module is integrated with Twenty server.
 */

import { TRIB_TOKENS } from '@twenty/trib-messages-module';

/**
 * SMS Queue Names
 *
 * All SMS operations use the centralized queue name with different job types
 * This ensures consistent queue management and processing
 */
export const SMS_QUEUE_NAMES = {
  SEND_SMS: TRIB_TOKENS.QUEUE_NAME,        // Main SMS sending queue
  SMS_STATUS_UPDATE: TRIB_TOKENS.QUEUE_NAME, // Status updates use same queue with different job type
  SMS_RATE_LIMIT: TRIB_TOKENS.QUEUE_NAME,    // Rate limiting uses same queue with different job type
} as const;

/**
 * SMS Queue Configuration Keys
 *
 * Configuration keys for SMS queue settings
 */
export const SMS_QUEUE_CONFIG = {
  CONCURRENCY: 5,
  RATE_LIMIT_MAX: 20,
  RATE_LIMIT_DURATION: 1000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 2000,
  REMOVE_ON_COMPLETE: 100,
  REMOVE_ON_FAIL: 50,
  STALLED_INTERVAL: 30000,
  MAX_STALLED_COUNT: 1,
} as const;

/**
 * SMS Queue Job Types
 *
 * Job type constants for SMS queue processing
 */
export const SMS_QUEUE_JOB_TYPES = {
  SEND_SMS: 'send-sms',
  UPDATE_STATUS: 'update-status',
  RETRY_FAILED: 'retry-failed',
  CLEANUP_JOBS: 'cleanup-jobs',
} as const;

/**
 * SMS Queue Events
 *
 * Event constants for SMS queue monitoring
 */
export const SMS_QUEUE_EVENTS = {
  JOB_COMPLETED: 'job-completed',
  JOB_FAILED: 'job-failed',
  JOB_STALLED: 'job-stalled',
  JOB_RETRIED: 'job-retried',
  RATE_LIMIT_HIT: 'rate-limit-hit',
} as const;

/**
 * Type definitions for SMS queue constants
 */
export type SmsQueueName =
  (typeof SMS_QUEUE_NAMES)[keyof typeof SMS_QUEUE_NAMES];
export type SmsQueueJobType =
  (typeof SMS_QUEUE_JOB_TYPES)[keyof typeof SMS_QUEUE_JOB_TYPES];
export type SmsQueueEvent =
  (typeof SMS_QUEUE_EVENTS)[keyof typeof SMS_QUEUE_EVENTS];
