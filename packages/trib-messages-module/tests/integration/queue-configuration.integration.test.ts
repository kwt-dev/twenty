import { Test, TestingModule } from '@nestjs/testing';
import { BullModule } from '@nestjs/bull';
import { getSmsQueueConfig } from '../../src/config/sms-queue.config';
import { TRIB_TOKENS } from '../../src/tokens';

describe('Queue Configuration Integration', () => {
  let module: TestingModule;

  beforeAll(async () => {
    const config = getSmsQueueConfig();
    
    module = await Test.createTestingModule({
      imports: [
        BullModule.forRootAsync({
          useFactory: () => ({
            redis: {
              host: 'localhost',
              port: 6379,
              maxRetriesPerRequest: 3,
            },
          }),
        }),
        BullModule.registerQueueAsync({
          name: config.name,
          useFactory: () => config.options,
        }),
      ],
    }).compile();
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
  });

  describe('SMS Queue Registration', () => {
    it('should register SMS queue with correct name', () => {
      const config = getSmsQueueConfig();
      expect(config.name).toBe(TRIB_TOKENS.QUEUE_NAME);
    });

    it('should configure queue with proper retry settings', () => {
      const config = getSmsQueueConfig();
      expect(config.options.defaultJobOptions?.attempts).toBe(3);
      expect(config.options.defaultJobOptions?.backoff).toEqual({
        type: 'exponential',
        delay: 2000,
      });
    });

    it('should configure queue with job retention settings', () => {
      const config = getSmsQueueConfig();
      expect(config.options.defaultJobOptions?.removeOnComplete).toBe(100);
      expect(config.options.defaultJobOptions?.removeOnFail).toBe(50);
    });

    it('should configure queue with rate limiting', () => {
      const config = getSmsQueueConfig();
      expect(config.options.limiter?.max).toBe(20);
      expect(config.options.limiter?.duration).toBe(1000);
    });

    it('should configure Redis connection properly', () => {
      const config = getSmsQueueConfig();
      const redisConfig = config.options.redis as any;
      
      expect(redisConfig).toBeDefined();
      expect(redisConfig?.host).toBe('localhost');
      expect(redisConfig?.port).toBe(6379);
    });

    it('should use environment variables for Redis configuration', () => {
      const originalEnv = process.env;
      process.env.REDIS_HOST = 'test-redis';
      process.env.REDIS_PORT = '6380';
      process.env.REDIS_PASSWORD = 'test-password';
      
      const config = getSmsQueueConfig();
      const redisConfig = config.options.redis as any;
      
      expect(redisConfig?.host).toBe('test-redis');
      expect(redisConfig?.port).toBe(6380);
      expect(redisConfig?.password).toBe('test-password');
      
      process.env = originalEnv;
    });
  });

  describe('Queue Configuration Validation', () => {
    it('should have configuration that works with BullModule', () => {
      expect(module).toBeDefined();
      
      const config = getSmsQueueConfig();
      expect(config.options).toBeDefined();
      expect(config.name).toBe(TRIB_TOKENS.QUEUE_NAME);
    });

    it('should configure appropriate settings for SMS processing', () => {
      const config = getSmsQueueConfig();
      
      // Should have rate limiting for Twilio compliance
      expect(config.options.limiter?.max).toBe(20);
      expect(config.options.limiter?.duration).toBe(1000);
      
      // Should have retry logic for failed messages
      expect(config.options.defaultJobOptions?.attempts).toBe(3);
      const backoff = config.options.defaultJobOptions?.backoff as any;
      expect(backoff?.type).toBe('exponential');
      
      // Should have job cleanup to prevent memory leaks
      expect(config.options.defaultJobOptions?.removeOnComplete).toBeGreaterThan(0);
      expect(config.options.defaultJobOptions?.removeOnFail).toBeGreaterThan(0);
    });

    it('should maintain consistent configuration between calls', () => {
      const config1 = getSmsQueueConfig();
      const config2 = getSmsQueueConfig();
      
      expect(config1.name).toBe(config2.name);
      expect(config1.options.defaultJobOptions?.attempts).toBe(config2.options.defaultJobOptions?.attempts);
      expect(config1.options.limiter?.max).toBe(config2.options.limiter?.max);
    });
  });
});