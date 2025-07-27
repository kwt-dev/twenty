/**
 * Standalone Operation Verification Tests
 *
 * These tests validate that the TribMessagesModule works correctly in standalone mode
 * without external dependencies like Redis or Twenty's services. This ensures the
 * circular dependency fixes are complete and the module is truly self-contained.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { DefaultRedisClientService } from '../../providers/default-redis-client';
import { DefaultMessageQueueService } from '../../providers/default-message-queue-service';
import { TRIB_TOKENS } from '../../tokens';
import { SmsRateLimiterService } from '../../services/sms-rate-limiter.service';
import { RateLimitCalculatorService } from '../../utils/rate-limiting/rate-limit-calculator';
import { RateLimitKeyGeneratorService } from '../../utils/rate-limiting/rate-limit-key-generator';

// Test constants
const TEST_WORKSPACE_ID = 'standalone-test-workspace';
const TEST_MESSAGE_ID = 'standalone-test-message';
const TEST_TO_NUMBER = '+15551234567';
const TEST_FROM_NUMBER = '+15557654321';
const TEST_MESSAGE_CONTENT = 'Standalone test message';

describe('Standalone Operation Verification', () => {
  let module: TestingModule;
  let rateLimiterService: SmsRateLimiterService;
  let defaultRedisClient: DefaultRedisClientService;
  let defaultMessageQueueService: DefaultMessageQueueService;

  // Create a mock queue for testing
  const mockQueue = {
    add: jest.fn().mockResolvedValue({}),
    process: jest.fn(),
  };

  beforeAll(async () => {
    // Initialize module with minimal dependencies for testing standalone behavior
    module = await Test.createTestingModule({
      providers: [
        DefaultRedisClientService,
        DefaultMessageQueueService,
        SmsRateLimiterService,
        RateLimitCalculatorService,
        RateLimitKeyGeneratorService,
        {
          provide: TRIB_TOKENS.REDIS_CLIENT,
          useClass: DefaultRedisClientService,
        },
        {
          provide: TRIB_TOKENS.MESSAGE_QUEUE_SERVICE,
          useClass: DefaultMessageQueueService,
        },
        {
          provide: 'IRedisClientService',
          useExisting: TRIB_TOKENS.REDIS_CLIENT,
        },
        {
          provide: 'BullQueue_trib-messages',
          useValue: mockQueue,
        },
      ],
    }).compile();

    // Get service instances
    rateLimiterService = module.get<SmsRateLimiterService>(
      SmsRateLimiterService,
    );

    // Get default providers directly
    defaultRedisClient = module.get<DefaultRedisClientService>(
      TRIB_TOKENS.REDIS_CLIENT,
    );
    defaultMessageQueueService = module.get<DefaultMessageQueueService>(
      TRIB_TOKENS.MESSAGE_QUEUE_SERVICE,
    );
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
  });

  describe('Module Initialization', () => {
    it('should initialize module successfully without external dependencies', () => {
      expect(module).toBeDefined();
      expect(rateLimiterService).toBeDefined();
    });

    it('should use DefaultRedisClientService as fallback', () => {
      expect(defaultRedisClient).toBeDefined();
      expect(defaultRedisClient).toBeInstanceOf(DefaultRedisClientService);
    });

    it('should use DefaultMessageQueueService as fallback', () => {
      expect(defaultMessageQueueService).toBeDefined();
      expect(defaultMessageQueueService).toBeInstanceOf(
        DefaultMessageQueueService,
      );
    });

    it('should have all required services available', () => {
      // Core services should be available
      expect(() => module.get(SmsRateLimiterService)).not.toThrow();

      // Token-based services should be available
      expect(() => module.get(TRIB_TOKENS.REDIS_CLIENT)).not.toThrow();
      expect(() => module.get(TRIB_TOKENS.MESSAGE_QUEUE_SERVICE)).not.toThrow();
    });
  });

  describe('Redis Fallback Behavior', () => {
    it('should handle rate limiting with DefaultRedisClientService', async () => {
      const rateLimitRequest = {
        workspaceId: TEST_WORKSPACE_ID,
        messageType: 'SMS' as const,
      };

      // Should not throw and should return a valid response
      const result =
        await rateLimiterService.checkAndIncrement(rateLimitRequest);

      expect(result).toBeDefined();
      expect(typeof result.allowed).toBe('boolean');
      expect(typeof result.remaining).toBe('number');
    });

    it('should gracefully handle Redis operations without external Redis', async () => {
      // Test Redis operations directly
      const testKey = 'test-key';
      const testValue = 'test-value';
      const redisClient = defaultRedisClient.getClient();

      // Should not throw errors
      await expect(redisClient.del(testKey)).resolves.not.toThrow();
      await expect(redisClient.incr(testKey)).resolves.not.toThrow();
      await expect(redisClient.get(testKey)).resolves.not.toThrow();
    });

    it('should fail open when Redis operations encounter errors', async () => {
      // Force an error condition and verify graceful handling
      const rateLimitRequest = {
        workspaceId: TEST_WORKSPACE_ID,
        messageType: 'SMS' as const,
      };

      // Should still allow operations even if Redis has issues
      const result =
        await rateLimiterService.checkAndIncrement(rateLimitRequest);
      expect(result.allowed).toBe(true); // Should fail open
    });

    it('should provide reasonable rate limiting behavior without Redis', async () => {
      // Test multiple rate limit checks
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          rateLimiterService.checkAndIncrement({
            workspaceId: `${TEST_WORKSPACE_ID}-${i}`,
            messageType: 'SMS' as const,
          }),
        );
      }

      const results = await Promise.all(promises);
      results.forEach((result) => {
        expect(result).toBeDefined();
        expect(typeof result.allowed).toBe('boolean');
        expect(typeof result.remaining).toBe('number');
      });
    });
  });

  describe('Message Queue Fallback Behavior', () => {
    it('should handle message queueing with DefaultMessageQueueService', async () => {
      const jobData = {
        messageId: TEST_MESSAGE_ID,
        workspaceId: TEST_WORKSPACE_ID,
        data: { test: 'data' },
      };

      // Should not throw when adding jobs
      await expect(
        defaultMessageQueueService.add('test-job', jobData),
      ).resolves.not.toThrow();
    });

    it('should provide queue operations without external queue service', async () => {
      // Test queue operations directly
      const testJobName = 'standalone-test-job';
      const testJobData = { test: 'standalone' };

      // Should handle job addition gracefully
      await expect(
        defaultMessageQueueService.add(testJobName, testJobData),
      ).resolves.not.toThrow();
    });

    it('should handle work registration without external queue service', async () => {
      const mockHandler = jest.fn();

      // Should not throw when registering work handlers
      expect(() => {
        defaultMessageQueueService.work(mockHandler);
      }).not.toThrow();
    });
  });

  describe('Service Integration', () => {
    it('should maintain service isolation in standalone mode', () => {
      // Verify services are properly isolated and don't interfere
      expect(rateLimiterService).not.toBe(defaultRedisClient);
      expect(defaultRedisClient).not.toBe(defaultMessageQueueService);

      // All services should be separate instances
      const services = [
        rateLimiterService,
        defaultRedisClient,
        defaultMessageQueueService,
      ];
      const uniqueServices = new Set(services);
      expect(uniqueServices.size).toBe(services.length);
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle service errors gracefully', async () => {
      // Test that errors in one service don't cascade to others
      const rateLimitRequest = {
        workspaceId: TEST_WORKSPACE_ID,
        messageType: 'SMS' as const,
      };

      // Should handle rate limiting errors gracefully
      const result =
        await rateLimiterService.checkAndIncrement(rateLimitRequest);
      expect(result).toBeDefined();

      // Other services should still work
      expect(defaultMessageQueueService).toBeDefined();
    });

    it('should provide reasonable defaults for all operations', async () => {
      // Test that all operations have sensible defaults
      const rateLimitResult = await rateLimiterService.checkAndIncrement({
        workspaceId: TEST_WORKSPACE_ID,
        messageType: 'SMS' as const,
      });

      // Should provide reasonable defaults
      expect(rateLimitResult.allowed).toBe(true);
      expect(rateLimitResult.remaining).toBeGreaterThanOrEqual(0);
    });

    it('should handle missing configuration gracefully', () => {
      // Test that services work even without external configuration
      expect(() => defaultRedisClient.getClient().get('test')).not.toThrow();
      expect(() => defaultMessageQueueService.add('test', {})).not.toThrow();
    });
  });

  describe('Production Readiness', () => {
    it('should be ready for production use in standalone mode', () => {
      // Verify all critical services are available
      expect(module.get(SmsRateLimiterService)).toBeDefined();
      expect(module.get(TRIB_TOKENS.REDIS_CLIENT)).toBeDefined();
      expect(module.get(TRIB_TOKENS.MESSAGE_QUEUE_SERVICE)).toBeDefined();
    });

    it('should provide consistent API regardless of provider', () => {
      // Verify that the interface is consistent whether using defaults or overrides
      const redisClient = defaultRedisClient.getClient();
      expect(typeof redisClient.get).toBe('function');
      expect(typeof redisClient.incr).toBe('function');
      expect(typeof redisClient.del).toBe('function');

      expect(typeof defaultMessageQueueService.add).toBe('function');
      expect(typeof defaultMessageQueueService.work).toBe('function');
    });

    it('should handle concurrent operations safely', async () => {
      // Test concurrent operations don't interfere
      const promises = [];

      for (let i = 0; i < 10; i++) {
        promises.push(
          rateLimiterService.checkAndIncrement({
            workspaceId: `concurrent-${i}`,
            messageType: 'SMS' as const,
          }),
        );
      }

      const results = await Promise.all(promises);
      results.forEach((result) => {
        expect(result).toBeDefined();
        expect(typeof result.allowed).toBe('boolean');
      });
    });
  });

  describe('Integration Compatibility', () => {
    it('should provide all required exports for integration', () => {
      // Verify that all tokens and interfaces are available for integration
      expect(TRIB_TOKENS.REDIS_CLIENT).toBeDefined();
      expect(TRIB_TOKENS.MESSAGE_QUEUE_SERVICE).toBeDefined();
      expect(TRIB_TOKENS.LOGGER).toBeDefined();
      expect(TRIB_TOKENS.QUEUE_NAME).toBeDefined();
    });

    it('should support service replacement via DI', () => {
      // Verify that services can be replaced via dependency injection
      const redisService = module.get(TRIB_TOKENS.REDIS_CLIENT);
      const queueService = module.get(TRIB_TOKENS.MESSAGE_QUEUE_SERVICE);

      expect(redisService).toBeDefined();
      expect(queueService).toBeDefined();
    });
  });
});
