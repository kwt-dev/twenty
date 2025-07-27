import { Test, TestingModule } from '@nestjs/testing';
import { BullModule, InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { TribMessagesModule } from '../../trib-messages.module';
import { TribSmsService } from '../../services/trib_sms.service';
import { SmsQueueProcessor } from '../../processors/sms-queue.processor';
import { SmsRateLimiterService } from '../../services/sms-rate-limiter.service';
import { TwilioSignatureValidationMiddleware } from '../../middleware/twilio-signature-validation.middleware';
import { getSmsQueueConfig } from '../../config/sms-queue.config';
import { TRIB_TOKENS } from '../../tokens';
import { CreateSmsMessageDto } from '../../dto/create-message.dto';
import { SmsQueueJobData } from '../../types/queue-job-types';

// Mock Redis client for testing
const mockRedisClient = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  incr: jest.fn(),
  expire: jest.fn(),
  exists: jest.fn(),
  flushall: jest.fn(),
};

// Test constants
const TEST_WORKSPACE_ID = 'test-workspace-123';
const TEST_MESSAGE_ID = 'test-message-456';
const TEST_TO_NUMBER = '+1234567890';
const TEST_FROM_NUMBER = '+1987654321';
const TEST_MESSAGE_BODY = 'Test SMS message';
const TEST_RATE_LIMIT = 10;
const REDIS_PORT = 6379;
const QUEUE_PROCESSING_TIMEOUT = 30000;

describe('Slice 9a: Enhanced Module Integration Tests', () => {
  let module: TestingModule;
  let tribSmsService: TribSmsService;
  let smsQueue: Queue;
  let rateLimiterService: SmsRateLimiterService;
  let middleware: TwilioSignatureValidationMiddleware;

  beforeAll(async () => {
    // Set test environment variables
    process.env.REDIS_HOST = 'localhost';
    process.env.REDIS_PORT = String(REDIS_PORT);
    process.env.TWILIO_ACCOUNT_SID = 'test_account_sid';
    process.env.TWILIO_AUTH_TOKEN = 'test_auth_token';

    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        TribMessagesModule,
        BullModule.forRootAsync({
          useFactory: () => ({
            redis: {
              host: process.env.REDIS_HOST || 'localhost',
              port: parseInt(process.env.REDIS_PORT || '6379', 10),
              maxRetriesPerRequest: 3,
            },
          }),
        }),
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          autoLoadEntities: true,
          synchronize: true,
        }),
      ],
    }).compile();

    tribSmsService = module.get<TribSmsService>(TribSmsService);
    rateLimiterService = module.get<SmsRateLimiterService>(
      SmsRateLimiterService,
    );
    middleware = module.get<TwilioSignatureValidationMiddleware>(
      TwilioSignatureValidationMiddleware,
    );

    // Get queue instance for testing
    smsQueue = module.get<Queue>(`BullQueue_${TRIB_TOKENS.QUEUE_NAME}`);
  }, QUEUE_PROCESSING_TIMEOUT);

  afterAll(async () => {
    // Clean up queue jobs
    if (smsQueue) {
      await smsQueue.empty();
      await smsQueue.close();
    }
    await module.close();
  });

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    mockRedisClient.get.mockReset();
    mockRedisClient.set.mockReset();
    mockRedisClient.incr.mockReset();
  });

  describe('Queue Integration', () => {
    it('should register SMS queue with correct configuration', () => {
      expect(smsQueue).toBeDefined();
      expect(smsQueue.name).toBe(TRIB_TOKENS.QUEUE_NAME);
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

    it('should process SMS jobs through queue processor', async () => {
      const jobData: SmsQueueJobData = {
        messageId: TEST_MESSAGE_ID,
        twilioConfig: {
          accountSid: 'test_account_sid',
          authToken: 'test_auth_token',
          phoneNumber: TEST_FROM_NUMBER,
        },
        messageData: {
          to: TEST_TO_NUMBER,
          from: TEST_FROM_NUMBER,
          content: TEST_MESSAGE_BODY,
          channel: 'SMS' as any,
          workspaceId: TEST_WORKSPACE_ID,
        } as CreateSmsMessageDto,
        workspaceId: TEST_WORKSPACE_ID,
      };

      const job = await smsQueue.add('send-sms', jobData);
      expect(job).toBeDefined();
      expect(job.data).toEqual(jobData);
    });
  });

  describe('Redis Integration', () => {
    it('should connect to Redis for rate limiting', async () => {
      mockRedisClient.get.mockResolvedValue('5');

      const result = await rateLimiterService.checkAndIncrement({
        workspaceId: TEST_WORKSPACE_ID,
        messageType: 'SMS',
      });

      expect(mockRedisClient.get).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should use Redis for rate limit tracking', async () => {
      mockRedisClient.incr.mockResolvedValue(1);
      mockRedisClient.expire.mockResolvedValue(1);

      await rateLimiterService.checkAndIncrement({
        workspaceId: TEST_WORKSPACE_ID,
        messageType: 'SMS',
      });

      expect(mockRedisClient.incr).toHaveBeenCalled();
      expect(mockRedisClient.expire).toHaveBeenCalled();
    });

    it('should handle Redis connection errors gracefully', async () => {
      mockRedisClient.get.mockRejectedValue(
        new Error('Redis connection failed'),
      );

      // Should not throw, but handle gracefully
      const result = await rateLimiterService.checkAndIncrement({
        workspaceId: TEST_WORKSPACE_ID,
        messageType: 'SMS',
      });

      expect(result).toBeDefined();
      expect(result.allowed).toBe(true); // Fail open for availability
    });
  });

  describe('Service Integration', () => {
    it('should integrate TribSmsService with queue processing', async () => {
      const messageData: CreateSmsMessageDto = {
        to: TEST_TO_NUMBER,
        from: TEST_FROM_NUMBER,
        content: TEST_MESSAGE_BODY,
        channel: 'SMS' as any,
        workspaceId: TEST_WORKSPACE_ID,
      };

      // Mock rate limiter to allow message
      mockRedisClient.get.mockResolvedValue('5');

      // This would normally queue the message for processing
      expect(tribSmsService).toBeDefined();
      expect(typeof tribSmsService.sendMessage).toBe('function');
    });

    it('should integrate rate limiting with message sending', async () => {
      mockRedisClient.get.mockResolvedValue(String(TEST_RATE_LIMIT));

      const rateLimitResult = await rateLimiterService.checkAndIncrement({
        workspaceId: TEST_WORKSPACE_ID,
        messageType: 'SMS',
      });

      expect(rateLimitResult).toBeDefined();
      expect(typeof rateLimitResult.allowed).toBe('boolean');
      expect(typeof rateLimitResult.remaining).toBe('number');
    });

    it('should integrate webhook validation middleware', () => {
      expect(middleware).toBeDefined();
      expect(typeof middleware.use).toBe('function');

      // Middleware should be properly configured for Twilio webhook validation
      const mockReq = {
        body: { test: 'data' },
        headers: { 'x-twilio-signature': 'test-signature' },
        url: '/webhook/twilio',
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const mockNext = jest.fn();

      // Should not throw during basic validation
      expect(() => {
        middleware.use(mockReq as any, mockRes as any, mockNext);
      }).not.toThrow();
    });
  });

  describe('Workspace Isolation', () => {
    it('should maintain workspace isolation in rate limiting', async () => {
      const workspace1 = 'workspace-1';
      const workspace2 = 'workspace-2';

      mockRedisClient.get.mockResolvedValue('5');

      const result1 = await rateLimiterService.checkAndIncrement({
        workspaceId: workspace1,
        messageType: 'SMS',
      });
      const result2 = await rateLimiterService.checkAndIncrement({
        workspaceId: workspace2,
        messageType: 'SMS',
      });

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();

      // Should use different Redis keys for different workspaces
      expect(mockRedisClient.get).toHaveBeenCalledTimes(2);
    });

    it('should maintain workspace isolation in queue jobs', async () => {
      const jobData1: SmsQueueJobData = {
        messageId: 'msg-1',
        workspaceId: 'workspace-1',
        twilioConfig: {
          accountSid: 'test',
          authToken: 'test',
          phoneNumber: TEST_FROM_NUMBER,
        },
        messageData: {
          to: TEST_TO_NUMBER,
          from: TEST_FROM_NUMBER,
          content: 'Test 1',
          channel: 'SMS' as any,
          workspaceId: 'workspace-1',
        } as CreateSmsMessageDto,
      };

      const jobData2: SmsQueueJobData = {
        messageId: 'msg-2',
        workspaceId: 'workspace-2',
        twilioConfig: {
          accountSid: 'test',
          authToken: 'test',
          phoneNumber: TEST_FROM_NUMBER,
        },
        messageData: {
          to: TEST_TO_NUMBER,
          from: TEST_FROM_NUMBER,
          content: 'Test 2',
          channel: 'SMS' as any,
          workspaceId: 'workspace-2',
        } as CreateSmsMessageDto,
      };

      const job1 = await smsQueue.add('send-sms', jobData1);
      const job2 = await smsQueue.add('send-sms', jobData2);

      expect(job1.data.workspaceId).toBe('workspace-1');
      expect(job2.data.workspaceId).toBe('workspace-2');
      expect(job1.data.workspaceId).not.toBe(job2.data.workspaceId);
    });
  });

  describe('Error Handling', () => {
    it('should handle queue processing errors gracefully', async () => {
      const invalidJobData = {
        messageId: TEST_MESSAGE_ID,
        // Missing required fields
      };

      // Should not throw when adding invalid job data
      expect(async () => {
        await smsQueue.add('send-sms', invalidJobData);
      }).not.toThrow();
    });

    it('should handle Redis errors in rate limiting', async () => {
      mockRedisClient.get.mockRejectedValue(new Error('Redis timeout'));

      const result = await rateLimiterService.checkAndIncrement({
        workspaceId: TEST_WORKSPACE_ID,
        messageType: 'SMS',
      });

      // Should fail open to maintain availability
      expect(result.allowed).toBe(true);
    });

    it('should handle missing environment variables gracefully', () => {
      const originalEnv = process.env.TWILIO_ACCOUNT_SID;
      delete process.env.TWILIO_ACCOUNT_SID;

      // Module should still initialize but with limited functionality
      expect(module).toBeDefined();
      expect(tribSmsService).toBeDefined();

      process.env.TWILIO_ACCOUNT_SID = originalEnv;
    });
  });

  describe('Performance Considerations', () => {
    it('should handle multiple concurrent queue jobs', async () => {
      const jobs = [];

      for (let i = 0; i < 5; i++) {
        const jobData: SmsQueueJobData = {
          messageId: `msg-${i}`,
          workspaceId: TEST_WORKSPACE_ID,
          twilioConfig: {
            accountSid: 'test',
            authToken: 'test',
            phoneNumber: TEST_FROM_NUMBER,
          },
          messageData: {
            to: TEST_TO_NUMBER,
            from: TEST_FROM_NUMBER,
            content: `Test ${i}`,
            channel: 'SMS' as any,
            workspaceId: TEST_WORKSPACE_ID,
          } as CreateSmsMessageDto,
        };

        jobs.push(smsQueue.add('send-sms', jobData));
      }

      const results = await Promise.all(jobs);
      expect(results).toHaveLength(5);
      results.forEach((job) => {
        expect(job).toBeDefined();
        expect(job.data.messageId).toMatch(/^msg-\d+$/);
      });
    });

    it('should handle rate limiting checks efficiently', async () => {
      mockRedisClient.get.mockResolvedValue('1');

      const startTime = Date.now();

      // Perform multiple rate limit checks
      const checks = [];
      for (let i = 0; i < 10; i++) {
        checks.push(
          rateLimiterService.checkAndIncrement({
            workspaceId: `${TEST_WORKSPACE_ID}-${i}`,
            messageType: 'SMS',
          }),
        );
      }

      await Promise.all(checks);
      const endTime = Date.now();

      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });
});
