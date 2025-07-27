import { getSmsQueueConfig, getSmsQueueProcessingOptions } from '../../../src/config/sms-queue.config';
import { SMS_QUEUE_CONFIG } from '../../../src/constants/sms-queue.constants';
import { TRIB_TOKENS } from '../../../src/tokens';

describe('SMS Queue Configuration', () => {
  describe('getSmsQueueConfig', () => {
    it('should return queue configuration with correct name', () => {
      const config = getSmsQueueConfig();
      
      expect(config.name).toBe(TRIB_TOKENS.QUEUE_NAME);
      expect(config.options).toBeDefined();
    });

    it('should configure retry settings with exponential backoff', () => {
      const config = getSmsQueueConfig();
      
      expect(config.options.defaultJobOptions?.attempts).toBe(SMS_QUEUE_CONFIG.RETRY_ATTEMPTS);
      expect(config.options.defaultJobOptions?.backoff).toEqual({
        type: 'exponential',
        delay: SMS_QUEUE_CONFIG.RETRY_DELAY,
      });
    });

    it('should configure job retention settings', () => {
      const config = getSmsQueueConfig();
      
      expect(config.options.defaultJobOptions?.removeOnComplete).toBe(SMS_QUEUE_CONFIG.REMOVE_ON_COMPLETE);
      expect(config.options.defaultJobOptions?.removeOnFail).toBe(SMS_QUEUE_CONFIG.REMOVE_ON_FAIL);
    });

    it('should configure rate limiting for Twilio compliance', () => {
      const config = getSmsQueueConfig();
      
      expect(config.options.limiter?.max).toBe(SMS_QUEUE_CONFIG.RATE_LIMIT_MAX);
      expect(config.options.limiter?.duration).toBe(SMS_QUEUE_CONFIG.RATE_LIMIT_DURATION);
    });

    it('should configure Redis connection with defaults', () => {
      const config = getSmsQueueConfig();
      const redisConfig = config.options.redis as any;
      
      expect(redisConfig?.host).toBe('localhost');
      expect(redisConfig?.port).toBe(6379);
      expect(redisConfig?.password).toBeUndefined();
    });

    it('should use environment variables for Redis configuration', () => {
      const originalEnv = process.env;
      process.env.REDIS_HOST = 'redis-server';
      process.env.REDIS_PORT = '6380';
      process.env.REDIS_PASSWORD = 'secret';
      
      const config = getSmsQueueConfig();
      const redisConfig = config.options.redis as any;
      
      expect(redisConfig?.host).toBe('redis-server');
      expect(redisConfig?.port).toBe(6380);
      expect(redisConfig?.password).toBe('secret');
      
      process.env = originalEnv;
    });
  });

  describe('getSmsQueueProcessingOptions', () => {
    it('should return processing options with correct concurrency', () => {
      const options = getSmsQueueProcessingOptions();
      
      expect(options.concurrency).toBe(SMS_QUEUE_CONFIG.CONCURRENCY);
    });

    it('should configure rate limiting for Twilio compliance', () => {
      const options = getSmsQueueProcessingOptions();
      
      expect(options.limiter.max).toBe(SMS_QUEUE_CONFIG.RATE_LIMIT_MAX);
      expect(options.limiter.duration).toBe(SMS_QUEUE_CONFIG.RATE_LIMIT_DURATION);
    });

    it('should match Twilio rate limit requirements', () => {
      const options = getSmsQueueProcessingOptions();
      
      // Should allow 20 messages per second (Twilio limit)
      expect(options.limiter.max).toBe(20);
      expect(options.limiter.duration).toBe(1000);
    });
  });

  describe('Configuration Constants Integration', () => {
    it('should use consistent values from constants', () => {
      const config = getSmsQueueConfig();
      const processingOptions = getSmsQueueProcessingOptions();
      
      // Verify configuration uses constants consistently
      expect(config.name).toBe(TRIB_TOKENS.QUEUE_NAME);
      expect(processingOptions.concurrency).toBe(SMS_QUEUE_CONFIG.CONCURRENCY);
      expect(processingOptions.limiter.max).toBe(SMS_QUEUE_CONFIG.RATE_LIMIT_MAX);
    });

    it('should maintain configuration stability', () => {
      const config1 = getSmsQueueConfig();
      const config2 = getSmsQueueConfig();
      
      expect(config1.name).toBe(config2.name);
      expect(config1.options.defaultJobOptions?.attempts).toBe(config2.options.defaultJobOptions?.attempts);
    });
  });
});