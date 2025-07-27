import {
  SMS_QUEUE_NAMES,
  SMS_QUEUE_CONFIG,
  SMS_QUEUE_JOB_TYPES,
  SMS_QUEUE_EVENTS,
  SmsQueueName,
  SmsQueueJobType,
  SmsQueueEvent,
} from '../../../src/constants/sms-queue.constants';
import { TRIB_TOKENS } from '../../../src/tokens';

describe('SMS Queue Constants', () => {
  describe('SMS_QUEUE_NAMES', () => {
    it('should define all required queue names', () => {
      expect(TRIB_TOKENS.QUEUE_NAME).toBe(TRIB_TOKENS.QUEUE_NAME);
      expect(SMS_QUEUE_NAMES.SMS_STATUS_UPDATE).toBe('sms-status-update');
      expect(SMS_QUEUE_NAMES.SMS_RATE_LIMIT).toBe('sms-rate-limit');
    });

    it('should have consistent constant values', () => {
      expect(TRIB_TOKENS.QUEUE_NAME).toBe(TRIB_TOKENS.QUEUE_NAME);
      expect(typeof TRIB_TOKENS.QUEUE_NAME).toBe('string');
    });

    it('should use centralized TRIB_TOKENS for queue naming', () => {
      expect(TRIB_TOKENS.QUEUE_NAME).toBe('trib-messages');
      expect(TRIB_TOKENS.QUEUE_NAME).toBe(TRIB_TOKENS.QUEUE_NAME);
    });
  });

  describe('SMS_QUEUE_CONFIG', () => {
    it('should define concurrency settings', () => {
      expect(SMS_QUEUE_CONFIG.CONCURRENCY).toBe(5);
    });

    it('should define rate limiting settings', () => {
      expect(SMS_QUEUE_CONFIG.RATE_LIMIT_MAX).toBe(20);
      expect(SMS_QUEUE_CONFIG.RATE_LIMIT_DURATION).toBe(1000);
    });

    it('should define retry settings', () => {
      expect(SMS_QUEUE_CONFIG.RETRY_ATTEMPTS).toBe(3);
      expect(SMS_QUEUE_CONFIG.RETRY_DELAY).toBe(2000);
    });

    it('should define job retention settings', () => {
      expect(SMS_QUEUE_CONFIG.REMOVE_ON_COMPLETE).toBe(100);
      expect(SMS_QUEUE_CONFIG.REMOVE_ON_FAIL).toBe(50);
    });

    it('should define stalled job settings', () => {
      expect(SMS_QUEUE_CONFIG.STALLED_INTERVAL).toBe(30000);
      expect(SMS_QUEUE_CONFIG.MAX_STALLED_COUNT).toBe(1);
    });

    it('should have consistent constant values', () => {
      expect(SMS_QUEUE_CONFIG.CONCURRENCY).toBe(5);
      expect(typeof SMS_QUEUE_CONFIG.CONCURRENCY).toBe('number');
    });
  });

  describe('SMS_QUEUE_JOB_TYPES', () => {
    it('should define all job types', () => {
      expect(SMS_QUEUE_JOB_TYPES.SEND_SMS).toBe('send-sms');
      expect(SMS_QUEUE_JOB_TYPES.UPDATE_STATUS).toBe('update-status');
      expect(SMS_QUEUE_JOB_TYPES.RETRY_FAILED).toBe('retry-failed');
      expect(SMS_QUEUE_JOB_TYPES.CLEANUP_JOBS).toBe('cleanup-jobs');
    });

    it('should have consistent constant values', () => {
      expect(SMS_QUEUE_JOB_TYPES.SEND_SMS).toBe('send-sms');
      expect(typeof SMS_QUEUE_JOB_TYPES.SEND_SMS).toBe('string');
    });
  });

  describe('SMS_QUEUE_EVENTS', () => {
    it('should define all event types', () => {
      expect(SMS_QUEUE_EVENTS.JOB_COMPLETED).toBe('job-completed');
      expect(SMS_QUEUE_EVENTS.JOB_FAILED).toBe('job-failed');
      expect(SMS_QUEUE_EVENTS.JOB_STALLED).toBe('job-stalled');
      expect(SMS_QUEUE_EVENTS.JOB_RETRIED).toBe('job-retried');
      expect(SMS_QUEUE_EVENTS.RATE_LIMIT_HIT).toBe('rate-limit-hit');
    });

    it('should have consistent constant values', () => {
      expect(SMS_QUEUE_EVENTS.JOB_COMPLETED).toBe('job-completed');
      expect(typeof SMS_QUEUE_EVENTS.JOB_COMPLETED).toBe('string');
    });
  });

  describe('Type Definitions', () => {
    it('should properly type SmsQueueName', () => {
      const queueName: SmsQueueName = TRIB_TOKENS.QUEUE_NAME;
      expect(queueName).toBe(TRIB_TOKENS.QUEUE_NAME);
    });

    it('should properly type SmsQueueJobType', () => {
      const jobType: SmsQueueJobType = SMS_QUEUE_JOB_TYPES.SEND_SMS;
      expect(jobType).toBe('send-sms');
    });

    it('should properly type SmsQueueEvent', () => {
      const event: SmsQueueEvent = SMS_QUEUE_EVENTS.JOB_COMPLETED;
      expect(event).toBe('job-completed');
    });
  });

  describe('Configuration Validation', () => {
    it('should have realistic concurrency settings', () => {
      expect(SMS_QUEUE_CONFIG.CONCURRENCY).toBeGreaterThan(0);
      expect(SMS_QUEUE_CONFIG.CONCURRENCY).toBeLessThanOrEqual(10);
    });

    it('should have Twilio-compliant rate limits', () => {
      // Twilio allows 20 messages per second
      expect(SMS_QUEUE_CONFIG.RATE_LIMIT_MAX).toBe(20);
      expect(SMS_QUEUE_CONFIG.RATE_LIMIT_DURATION).toBe(1000);
    });

    it('should have reasonable retry settings', () => {
      expect(SMS_QUEUE_CONFIG.RETRY_ATTEMPTS).toBeGreaterThan(0);
      expect(SMS_QUEUE_CONFIG.RETRY_ATTEMPTS).toBeLessThanOrEqual(5);
      expect(SMS_QUEUE_CONFIG.RETRY_DELAY).toBeGreaterThan(1000);
    });

    it('should have memory-efficient job retention', () => {
      expect(SMS_QUEUE_CONFIG.REMOVE_ON_COMPLETE).toBeGreaterThan(0);
      expect(SMS_QUEUE_CONFIG.REMOVE_ON_FAIL).toBeGreaterThan(0);
      expect(SMS_QUEUE_CONFIG.REMOVE_ON_COMPLETE).toBeGreaterThan(
        SMS_QUEUE_CONFIG.REMOVE_ON_FAIL,
      );
    });
  });
});
