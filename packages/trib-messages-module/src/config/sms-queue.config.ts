import { BullModuleOptions } from '@nestjs/bull';
import { SMS_QUEUE_CONFIG } from '../constants/sms-queue.constants';
import { TRIB_TOKENS } from '../tokens';

/**
 * SMS Queue Configuration
 *
 * Configures the SMS queue with appropriate settings for Twilio integration:
 * - Rate limiting to comply with Twilio's 20 messages/second limit
 * - Retry logic with exponential backoff for failed messages
 * - Job retention for debugging and monitoring
 * - Stalled job handling for reliability
 */

export interface SmsQueueConfig {
  /** Queue name for SMS processing */
  name: string;
  /** Queue configuration options */
  options: BullModuleOptions;
}

/**
 * Default SMS queue configuration
 */
const DEFAULT_SMS_QUEUE_CONFIG: SmsQueueConfig = {
  name: TRIB_TOKENS.QUEUE_NAME,
  options: {
    defaultJobOptions: {
      attempts: SMS_QUEUE_CONFIG.RETRY_ATTEMPTS,
      backoff: {
        type: 'exponential',
        delay: SMS_QUEUE_CONFIG.RETRY_DELAY,
      },
      removeOnComplete: SMS_QUEUE_CONFIG.REMOVE_ON_COMPLETE,
      removeOnFail: SMS_QUEUE_CONFIG.REMOVE_ON_FAIL,
    },
    limiter: {
      max: SMS_QUEUE_CONFIG.RATE_LIMIT_MAX,
      duration: SMS_QUEUE_CONFIG.RATE_LIMIT_DURATION,
    },
  },
};

/**
 * Gets the SMS queue configuration with proper settings for Twilio integration
 *
 * @returns SMS queue configuration with rate limits and retry logic
 */
export function getSmsQueueConfig(): SmsQueueConfig {
  return {
    name: DEFAULT_SMS_QUEUE_CONFIG.name,
    options: {
      ...DEFAULT_SMS_QUEUE_CONFIG.options,
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD,
      },
    },
  };
}

/**
 * Gets the SMS queue processing options for the worker
 *
 * @returns Processing options with concurrency and rate limiting
 */
export function getSmsQueueProcessingOptions() {
  return {
    concurrency: SMS_QUEUE_CONFIG.CONCURRENCY,
    limiter: {
      max: SMS_QUEUE_CONFIG.RATE_LIMIT_MAX,
      duration: SMS_QUEUE_CONFIG.RATE_LIMIT_DURATION,
    },
  };
}
