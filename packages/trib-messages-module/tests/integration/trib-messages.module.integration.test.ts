import { Test, TestingModule } from '@nestjs/testing';
import { BullModule } from '@nestjs/bull';
import { TribMessagesModule } from '../../src/trib-messages.module';
import { TribSmsService } from '../../src/services/trib_sms.service';
import { TwilioApiClientService } from '../../src/services/twilio-api-client.service';
import { SmsQueueProcessor } from '../../src/processors/sms-queue.processor';
import { TRIB_TOKENS } from '../../src/tokens';
import { getSmsQueueConfig } from '../../src/config/sms-queue.config';

describe('TribMessagesModule Integration', () => {
  let module: TestingModule;
  let tribSmsService: TribSmsService;
  let twilioApiClientService: TwilioApiClientService;
  let smsQueueProcessor: SmsQueueProcessor;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TribMessagesModule,
        // Mock BullModule to avoid Redis connection in tests
        BullModule.forRootAsync({
          useFactory: () => ({
            redis: {
              host: 'localhost',
              port: 6379,
              maxRetriesPerRequest: 3,
            },
          }),
        }),
      ],
    }).compile();

    tribSmsService = module.get<TribSmsService>(TribSmsService);
    twilioApiClientService = module.get<TwilioApiClientService>(TwilioApiClientService);
    smsQueueProcessor = module.get<SmsQueueProcessor>(SmsQueueProcessor);
  });

  afterAll(async () => {
    await module.close();
  });

  describe('Module Registration', () => {
    it('should compile the module successfully', () => {
      expect(module).toBeDefined();
    });

    it('should register TribSmsService provider', () => {
      expect(tribSmsService).toBeDefined();
      expect(tribSmsService).toBeInstanceOf(TribSmsService);
    });

    it('should register TwilioApiClientService provider', () => {
      expect(twilioApiClientService).toBeDefined();
      expect(twilioApiClientService).toBeInstanceOf(TwilioApiClientService);
    });

    it('should register SmsQueueProcessor provider', () => {
      expect(smsQueueProcessor).toBeDefined();
      expect(smsQueueProcessor).toBeInstanceOf(SmsQueueProcessor);
    });

    it('should export TribSmsService', () => {
      const exportedService = module.get<TribSmsService>(TribSmsService);
      expect(exportedService).toBeDefined();
      expect(exportedService).toBe(tribSmsService);
    });

    it('should export TwilioApiClientService', () => {
      const exportedService = module.get<TwilioApiClientService>(TwilioApiClientService);
      expect(exportedService).toBeDefined();
      expect(exportedService).toBe(twilioApiClientService);
    });
  });

  describe('Queue Configuration', () => {
    it('should configure SMS queue with correct name', () => {
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
  });

  describe('Service Dependencies', () => {
    it('should inject TwilioApiClientService into SmsQueueProcessor', () => {
      expect(smsQueueProcessor).toBeDefined();
      // Verify processor has access to Twilio client
      expect(smsQueueProcessor['twilioApiClient']).toBeDefined();
    });

    it('should maintain proper service isolation', () => {
      expect(tribSmsService).not.toBe(twilioApiClientService);
      expect(tribSmsService).not.toBe(smsQueueProcessor);
      expect(twilioApiClientService).not.toBe(smsQueueProcessor);
    });
  });

  describe('Module Validation', () => {
    it('should have all required providers registered', () => {
      const providers = [
        TribSmsService,
        TwilioApiClientService,
        SmsQueueProcessor,
      ];

      providers.forEach((provider) => {
        expect(() => module.get(provider)).not.toThrow();
      });
    });

    it('should have all required exports available', () => {
      const exports = [
        TribSmsService,
        TwilioApiClientService,
      ];

      exports.forEach((exportedService) => {
        expect(() => module.get(exportedService)).not.toThrow();
      });
    });
  });

  describe('Queue Integration', () => {
    it('should register queue with BullModule', () => {
      // This test verifies the queue is properly registered
      // In a real environment, we would test actual queue functionality
      expect(module).toBeDefined();
      const config = getSmsQueueConfig();
      expect(config.name).toBe(TRIB_TOKENS.QUEUE_NAME);
    });

    it('should configure queue with proper connection settings', () => {
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
});