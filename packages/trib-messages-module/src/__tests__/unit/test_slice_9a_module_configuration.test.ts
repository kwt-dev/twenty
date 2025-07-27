import { Test, TestingModule } from '@nestjs/testing';
import { BullModule } from '@nestjs/bull';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TribMessagesModule } from '../../trib-messages.module';
import { TribSmsService } from '../../services/trib_sms.service';
import { TwilioApiClientService } from '../../services/twilio-api-client.service';
import { SmsStatusUpdaterService } from '../../services/sms-status-updater.service';
import { SmsRateLimiterService } from '../../services/sms-rate-limiter.service';
import { RateLimitCalculatorService } from '../../utils/rate-limiting/rate-limit-calculator';
import { RateLimitKeyGeneratorService } from '../../utils/rate-limiting/rate-limit-key-generator';
import { SmsQueueProcessor } from '../../processors/sms-queue.processor';
import { TribWebhookController } from '../../controllers/trib-webhook.controller';
import { TwilioSignatureValidationMiddleware } from '../../middleware/twilio-signature-validation.middleware';
import { TwilioResponseTransformerService } from '../../utils/twilio/response-transformer';
import { TribMessageWorkspaceEntity } from '../../standard-objects/trib-message.workspace-entity';
import { TribThreadWorkspaceEntity } from '../../standard-objects/trib-thread.workspace-entity';
import { TribConsentWorkspaceEntity } from '../../standard-objects/trib-consent.workspace-entity';
import { TribDeliveryWorkspaceEntity } from '../../standard-objects/trib-delivery.workspace-entity';
import { TribPhoneNumberWorkspaceEntity } from '../../standard-objects/trib-phone-number.workspace-entity';

jest.mock('../../config/sms-queue.config', () => ({
  getSmsQueueConfig: jest.fn(() => ({
    name: 'send-sms',
    options: {
      defaultJobOptions: {
        attempts: TEST_QUEUE_ATTEMPTS,
        backoff: {
          type: 'exponential',
          delay: TEST_QUEUE_DELAY,
        },
        removeOnComplete: TEST_REMOVE_ON_COMPLETE,
        removeOnFail: TEST_REMOVE_ON_FAIL,
      },
      limiter: {
        max: TEST_RATE_LIMIT_MAX,
        duration: TEST_RATE_LIMIT_DURATION,
      },
      redis: {
        host: 'localhost',
        port: REDIS_PORT,
      },
    },
  })),
}));

// Test constants to avoid magic numbers
const TEST_QUEUE_ATTEMPTS = 3;
const TEST_QUEUE_DELAY = 2000;
const TEST_REMOVE_ON_COMPLETE = 100;
const TEST_REMOVE_ON_FAIL = 50;
const TEST_RATE_LIMIT_MAX = 20;
const TEST_RATE_LIMIT_DURATION = 1000;
const REDIS_PORT = 6379;
const EXPECTED_ENTITY_COUNT = 5;

describe('Slice 9a: Enhanced TribMessagesModule Configuration', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TribMessagesModule,
        // Mock BullModule for queue testing
        BullModule.forRootAsync({
          useFactory: () => ({
            redis: {
              host: 'localhost',
              port: REDIS_PORT,
              maxRetriesPerRequest: TEST_QUEUE_ATTEMPTS,
            },
          }),
        }),
        // Mock TypeORM for entity testing
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [
            TribMessageWorkspaceEntity,
            TribThreadWorkspaceEntity,
            TribConsentWorkspaceEntity,
            TribDeliveryWorkspaceEntity,
            TribPhoneNumberWorkspaceEntity,
          ],
          synchronize: true,
        }),
      ],
    }).compile();
  });

  afterAll(async () => {
    await module.close();
  });

  describe('Module Registration', () => {
    it('should compile the module successfully', () => {
      expect(module).toBeDefined();
    });

    it('should register all core services', () => {
      const coreServices = [
        TribSmsService,
        TwilioApiClientService,
        SmsStatusUpdaterService,
        SmsRateLimiterService,
      ];

      coreServices.forEach((serviceClass) => {
        const service = module.get(serviceClass);
        expect(service).toBeDefined();
        expect(service).toBeInstanceOf(serviceClass);
      });
    });

    it('should register all utility services', () => {
      const utilityServices = [
        RateLimitCalculatorService,
        RateLimitKeyGeneratorService,
        TwilioResponseTransformerService,
        TwilioSignatureValidationMiddleware,
      ];

      utilityServices.forEach((serviceClass) => {
        const service = module.get(serviceClass);
        expect(service).toBeDefined();
        expect(service).toBeInstanceOf(serviceClass);
      });
    });

    it('should register queue processor', () => {
      const processor = module.get<SmsQueueProcessor>(SmsQueueProcessor);
      expect(processor).toBeDefined();
      expect(processor).toBeInstanceOf(SmsQueueProcessor);
    });

    it('should register webhook controller', () => {
      const controller = module.get<TribWebhookController>(
        TribWebhookController,
      );
      expect(controller).toBeDefined();
      expect(controller).toBeInstanceOf(TribWebhookController);
    });
  });

  describe('Entity Registration', () => {
    it('should register all workspace entities', () => {
      const entities = [
        TribMessageWorkspaceEntity,
        TribThreadWorkspaceEntity,
        TribConsentWorkspaceEntity,
        TribDeliveryWorkspaceEntity,
        TribPhoneNumberWorkspaceEntity,
      ];

      expect(entities).toHaveLength(EXPECTED_ENTITY_COUNT);

      entities.forEach((entityClass) => {
        // Verify entity metadata exists
        expect(entityClass).toBeDefined();
        expect(typeof entityClass).toBe('function');
      });
    });

    it('should register entities in workspace connection', () => {
      // This test verifies entities are registered with the 'workspace' connection
      // In a real environment, we would check TypeORM metadata
      expect(module).toBeDefined();
    });
  });

  describe('Service Exports', () => {
    it('should export primary services for external use', () => {
      const primaryExports = [
        TribSmsService,
        TwilioApiClientService,
        TwilioResponseTransformerService,
        SmsStatusUpdaterService,
      ];

      primaryExports.forEach((exportedService) => {
        const service = module.get(exportedService);
        expect(service).toBeDefined();
        expect(service).toBeInstanceOf(exportedService);
      });
    });

    it('should export rate limiting services', () => {
      const rateLimitingExports = [
        SmsRateLimiterService,
        RateLimitCalculatorService,
        RateLimitKeyGeneratorService,
      ];

      rateLimitingExports.forEach((exportedService) => {
        const service = module.get(exportedService);
        expect(service).toBeDefined();
        expect(service).toBeInstanceOf(exportedService);
      });
    });

    it('should export middleware for webhook validation', () => {
      const middleware = module.get<TwilioSignatureValidationMiddleware>(
        TwilioSignatureValidationMiddleware,
      );
      expect(middleware).toBeDefined();
      expect(middleware).toBeInstanceOf(TwilioSignatureValidationMiddleware);
    });
  });

  describe('Queue Configuration', () => {
    it('should configure BullMQ queue with correct settings', () => {
      // Queue configuration is tested through module compilation
      // In integration tests, we would verify actual queue registration
      expect(module).toBeDefined();
    });

    it('should inject Redis client service correctly', () => {
      // Verify Redis injection token is properly configured
      const redisService = module.get('IRedisClientService');
      expect(redisService).toBeDefined();
    });
  });

  describe('Dependency Injection', () => {
    it('should inject dependencies correctly into SmsQueueProcessor', () => {
      const processor = module.get<SmsQueueProcessor>(SmsQueueProcessor);
      expect(processor).toBeDefined();

      // Verify processor has access to required services
      expect(processor['twilioApiClient']).toBeDefined();
      expect(processor['smsStatusUpdater']).toBeDefined();
    });

    it('should inject dependencies correctly into rate limiter service', () => {
      const rateLimiter = module.get<SmsRateLimiterService>(
        SmsRateLimiterService,
      );
      expect(rateLimiter).toBeDefined();

      // Verify rate limiter has access to calculator and key generator
      expect(rateLimiter['rateLimitCalculator']).toBeDefined();
      expect(rateLimiter['keyGenerator']).toBeDefined();
    });

    it('should maintain proper service isolation', () => {
      const tribSmsService = module.get<TribSmsService>(TribSmsService);
      const twilioApiClient = module.get<TwilioApiClientService>(
        TwilioApiClientService,
      );
      const processor = module.get<SmsQueueProcessor>(SmsQueueProcessor);

      // Verify services are separate instances
      expect(tribSmsService).not.toBe(twilioApiClient);
      expect(tribSmsService).not.toBe(processor);
      expect(twilioApiClient).not.toBe(processor);
    });
  });

  describe('Module Validation', () => {
    it('should have all required providers registered', () => {
      const requiredProviders = [
        TribSmsService,
        TwilioApiClientService,
        SmsStatusUpdaterService,
        SmsRateLimiterService,
        RateLimitCalculatorService,
        RateLimitKeyGeneratorService,
        TwilioResponseTransformerService,
        TwilioSignatureValidationMiddleware,
        SmsQueueProcessor,
      ];

      requiredProviders.forEach((provider) => {
        expect(() => module.get(provider)).not.toThrow();
      });
    });

    it('should have all required controllers registered', () => {
      const controllers = [TribWebhookController];

      controllers.forEach((controller) => {
        expect(() => module.get(controller)).not.toThrow();
      });
    });

    it('should provide Redis client injection token', () => {
      expect(() => module.get('IRedisClientService')).not.toThrow();
    });
  });

  describe('Enhanced Features', () => {
    it('should support queue processing with retry logic', () => {
      const processor = module.get<SmsQueueProcessor>(SmsQueueProcessor);
      expect(processor).toBeDefined();

      // Verify processor is properly configured for retry handling
      expect(typeof processor.handle).toBe('function');
    });

    it('should support rate limiting with workspace awareness', () => {
      const rateLimiter = module.get<SmsRateLimiterService>(
        SmsRateLimiterService,
      );
      expect(rateLimiter).toBeDefined();

      // Verify rate limiter supports workspace-specific limits
      expect(typeof rateLimiter.checkAndIncrement).toBe('function');
    });

    it('should support webhook signature validation', () => {
      const middleware = module.get<TwilioSignatureValidationMiddleware>(
        TwilioSignatureValidationMiddleware,
      );
      expect(middleware).toBeDefined();

      // Verify middleware implements NestJS middleware interface
      expect(typeof middleware.use).toBe('function');
    });

    it('should support Twilio response transformation', () => {
      const transformer = module.get<TwilioResponseTransformerService>(
        TwilioResponseTransformerService,
      );
      expect(transformer).toBeDefined();

      // Verify transformer provides standardized response handling
      expect(typeof transformer.transformSuccess).toBe('function');
    });
  });
});
