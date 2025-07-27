import { Module, DynamicModule, Provider, Logger } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TwilioApiClientService } from './services/twilio-api-client.service';
import { TribSmsService } from './services/trib_sms.service';
import { SmsStatusUpdaterService } from './services/sms-status-updater.service';
import { SmsRateLimiterService } from './services/sms-rate-limiter.service';
import { RateLimitCalculatorService } from './utils/rate-limiting/rate-limit-calculator';
import { RateLimitKeyGeneratorService } from './utils/rate-limiting/rate-limit-key-generator';
import { SmsQueueProcessor } from './processors/sms-queue.processor';
import { TribWebhookController } from './controllers/trib-webhook.controller';
import { TwilioSignatureValidationMiddleware } from './middleware/twilio-signature-validation.middleware';
import { TwilioResponseTransformerService } from './utils/twilio/response-transformer';
import { getSmsQueueConfig } from './config/sms-queue.config';
import { SMS_QUEUE_NAMES } from './constants/sms-queue.constants';
import { TRIB_TOKENS } from './tokens';
import { DefaultRedisClientService } from './providers/default-redis-client';
import {
  DefaultMessageQueueService,
  IMessageQueueService,
} from './providers/default-message-queue-service';
import { DefaultMessageRepository } from './providers/default-message-repository';
import { DefaultTribDeliveryRepository } from './providers/default-delivery-repository';
import { getQueueToken } from '@nestjs/bull';

/**
 * Trib Messages Module
 *
 * Enhanced module providing comprehensive SMS messaging functionality for Twenty CRM
 * with Twilio integration, queue processing, rate limiting, and webhook handling.
 *
 * Key Components:
 * - SmsQueueProcessor: Handles SMS queue processing with Twenty's message queue system
 * - TwilioApiClientService: Manages Twilio API integration with enhanced error handling
 * - TribSmsService: Core SMS business logic with enhanced validation
 * - SmsRateLimiterService: Workspace-aware rate limiting with Redis integration
 * - TwilioResponseTransformerService: Standardizes Twilio API responses
 * - TwilioSignatureValidationMiddleware: Validates webhook authenticity
 *
 * Queue Integration:
 * - Uses BullMQ for job processing with Redis backend
 * - Configured with Twilio rate limits (20 messages/second)
 * - Exponential backoff retry logic with enhanced error handling
 * - Job retention for debugging and monitoring
 *
 * Rate Limiting:
 * - Workspace-tier based rate limiting (free/basic/premium/enterprise)
 * - Redis-backed rate limit tracking with time windows
 * - Proactive rate limit calculation and enforcement
 *
 * Security:
 * - HMAC-SHA1 webhook signature validation
 * - Timing-safe signature comparison
 * - Environment-based configuration management
 *
 * @example
 * // Standalone usage with default providers
 * @Module({
 *   imports: [TribMessagesModule],
 * })
 * export class AppModule {}
 *
 * @example
 * // Twenty integration with external providers
 * @Module({
 *   imports: [
 *     TribMessagesModule.forRoot([
 *       { provide: TRIB_TOKENS.REDIS_CLIENT, useExisting: RedisClientService },
 *       { provide: TRIB_TOKENS.MESSAGE_QUEUE_SERVICE, useExisting: MessageQueueService },
 *     ])
 *   ],
 * })
 * export class AppModule {}
 */
@Module({
  imports: [
    BullModule.registerQueueAsync({
      name: TRIB_TOKENS.QUEUE_NAME,
      useFactory: () => {
        const config = getSmsQueueConfig();
        return config.options;
      },
    }),
    // Note: Using dependency injection tokens instead of direct TypeORM integration
    // to avoid circular dependencies with Twenty's workspace ORM system
  ],
  controllers: [TribWebhookController],
  providers: [
    // Queue Processing
    SmsQueueProcessor,
    // Core Services
    TwilioApiClientService,
    TribSmsService,
    SmsStatusUpdaterService,
    SmsRateLimiterService,
    // Rate limiting utilities
    RateLimitCalculatorService,
    RateLimitKeyGeneratorService,
    // Twilio integration utilities
    TwilioResponseTransformerService,
    TwilioSignatureValidationMiddleware,
    // Default provider implementations
    DefaultRedisClientService,
    DefaultMessageQueueService,
    DefaultMessageRepository,
    DefaultTribDeliveryRepository,
    // DI Token providers
    {
      provide: TRIB_TOKENS.REDIS_CLIENT,
      useClass: DefaultRedisClientService,
    },
    {
      provide: TRIB_TOKENS.MESSAGE_QUEUE_SERVICE,
      useClass: DefaultMessageQueueService,
    },
    {
      provide: TRIB_TOKENS.MESSAGE_REPOSITORY,
      useClass: DefaultMessageRepository,
    },
    {
      provide: TRIB_TOKENS.DELIVERY_REPOSITORY,
      useClass: DefaultTribDeliveryRepository,
    },
    {
      provide: TRIB_TOKENS.LOGGER,
      useValue: new Logger('TribMessages'),
    },
    // Backward compatibility for existing token
    {
      provide: 'IRedisClientService',
      useExisting: TRIB_TOKENS.REDIS_CLIENT,
    },
  ],
  exports: [
    // Primary service for external use
    TribSmsService,
    // API integration services
    TwilioApiClientService,
    TwilioResponseTransformerService,
    // Queue and status services for monitoring
    SmsStatusUpdaterService,
    // Rate limiting for other modules
    SmsRateLimiterService,
    RateLimitCalculatorService,
    RateLimitKeyGeneratorService,
    // Middleware for webhook validation
    TwilioSignatureValidationMiddleware,
    // Export tokens for integration
    TRIB_TOKENS.REDIS_CLIENT,
    TRIB_TOKENS.MESSAGE_QUEUE_SERVICE,
  ],
})
export class TribMessagesModule {
  /**
   * Dynamic module configuration for integration with Twenty or custom providers
   *
   * @param overrides - Array of providers to override default implementations
   * @returns DynamicModule with custom provider configuration
   *
   * @example
   * // Override Redis client only
   * TribMessagesModule.forRoot([
   *   { provide: TRIB_TOKENS.REDIS_CLIENT, useExisting: CustomRedisService },
   * ])
   *
   * @example
   * // Override both Redis and Message Queue services
   * TribMessagesModule.forRoot([
   *   { provide: TRIB_TOKENS.REDIS_CLIENT, useExisting: RedisClientService },
   *   { provide: TRIB_TOKENS.MESSAGE_QUEUE_SERVICE, useExisting: MessageQueueService },
   * ])
   */
  static forRoot(overrides: Provider[] = []): DynamicModule {
    return {
      module: TribMessagesModule,
      imports: [
        BullModule.registerQueueAsync({
          name: TRIB_TOKENS.QUEUE_NAME,
          useFactory: () => {
            const config = getSmsQueueConfig();
            return config.options;
          },
        }),
        // Note: Using dependency injection tokens instead of direct TypeORM integration
        // to avoid circular dependencies with Twenty's workspace ORM system
      ],
      controllers: [TribWebhookController],
      providers: [
        // Queue Processing
        SmsQueueProcessor,
        // Core Services
        TwilioApiClientService,
        TribSmsService,
        SmsStatusUpdaterService,
        SmsRateLimiterService,
        // Rate limiting utilities
        RateLimitCalculatorService,
        RateLimitKeyGeneratorService,
        // Twilio integration utilities
        TwilioResponseTransformerService,
        TwilioSignatureValidationMiddleware,
        // Default provider implementations
        DefaultRedisClientService,
        DefaultMessageQueueService,
        DefaultMessageRepository,
        DefaultTribDeliveryRepository,
        // DI Token providers (can be overridden)
        {
          provide: TRIB_TOKENS.REDIS_CLIENT,
          useClass: DefaultRedisClientService,
        },
        {
          provide: TRIB_TOKENS.MESSAGE_QUEUE_SERVICE,
          useClass: DefaultMessageQueueService,
        },
        {
          provide: TRIB_TOKENS.MESSAGE_REPOSITORY,
          useClass: DefaultMessageRepository,
        },
        {
          provide: TRIB_TOKENS.DELIVERY_REPOSITORY,
          useClass: DefaultTribDeliveryRepository,
        },
        {
          provide: TRIB_TOKENS.LOGGER,
          useValue: new Logger('TribMessages'),
        },
        // Backward compatibility for existing token
        {
          provide: 'IRedisClientService',
          useExisting: TRIB_TOKENS.REDIS_CLIENT,
        },
        // Apply overrides
        ...overrides,
      ],
      exports: [
        // Primary service for external use
        TribSmsService,
        // API integration services
        TwilioApiClientService,
        TwilioResponseTransformerService,
        // Queue and status services for monitoring
        SmsStatusUpdaterService,
        // Rate limiting for other modules
        SmsRateLimiterService,
        RateLimitCalculatorService,
        RateLimitKeyGeneratorService,
        // Middleware for webhook validation
        TwilioSignatureValidationMiddleware,
        // Export tokens for integration
        TRIB_TOKENS.REDIS_CLIENT,
        TRIB_TOKENS.MESSAGE_QUEUE_SERVICE,
      ],
    };
  }
}
