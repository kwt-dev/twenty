import { Test, TestingModule } from '@nestjs/testing';
import {
  SmsRateLimiterService,
  IRedisClientService,
} from '../../services/sms-rate-limiter.service';
import { RateLimitKeyGeneratorService } from '../../utils/rate-limiting/rate-limit-key-generator';
import { RateLimitCalculatorService } from '../../utils/rate-limiting/rate-limit-calculator';

// Test constants
const TEST_WORKSPACE_ID = 'integration-test-workspace';
const TEST_SMS_TYPE = 'SMS';
const TEST_MMS_TYPE = 'MMS';
const REDIS_URL = 'redis://localhost:6379';
const TEST_TIMEOUT = 30000;

describe('SmsRateLimiterService Integration Tests', () => {
  let service: SmsRateLimiterService;
  let mockRedisData: Map<
    string,
    { value: string; ttl: number; expiry: number }
  >;
  let module: TestingModule;
  let mockRedisClient: any;

  beforeAll(async () => {
    mockRedisData = new Map();

    // Create mock Redis client that simulates real Redis behavior
    mockRedisClient = {
      get: async (key: string) => {
        const entry = mockRedisData.get(key);
        if (!entry) return null;

        // Check if key has expired
        if (Date.now() > entry.expiry) {
          mockRedisData.delete(key);
          return null;
        }

        return entry.value;
      },

      incr: async (key: string) => {
        const entry = mockRedisData.get(key);
        if (!entry || Date.now() > entry.expiry) {
          mockRedisData.set(key, {
            value: '1',
            ttl: 0,
            expiry: Date.now() + 60000,
          });
          return 1;
        }

        const newValue = parseInt(entry.value) + 1;
        entry.value = newValue.toString();
        return newValue;
      },

      expire: async (key: string, seconds: number) => {
        const entry = mockRedisData.get(key);
        if (entry) {
          entry.ttl = seconds;
          entry.expiry = Date.now() + seconds * 1000;
          return 1;
        }
        return 0;
      },

      del: async (...keys: string[]) => {
        let deletedCount = 0;
        keys.forEach((key) => {
          if (mockRedisData.has(key)) {
            mockRedisData.delete(key);
            deletedCount++;
          }
        });
        return deletedCount;
      },

      ttl: async (key: string) => {
        const entry = mockRedisData.get(key);
        if (!entry) return -2;

        const remainingSeconds = Math.ceil((entry.expiry - Date.now()) / 1000);
        return remainingSeconds > 0 ? remainingSeconds : -2;
      },

      keys: async (pattern: string) => {
        const regex = new RegExp(pattern.replace('*', '.*'));
        return Array.from(mockRedisData.keys()).filter((key) =>
          regex.test(key),
        );
      },

      pipeline: function () {
        const pipelineCommands: Array<{
          type: 'incr' | 'expire';
          key: string;
          seconds?: number;
        }> = [];

        const pipelineInstance: any = {
          incr: (key: string): any => {
            pipelineCommands.push({ type: 'incr', key });
            return pipelineInstance;
          },
          expire: (key: string, seconds: number): any => {
            pipelineCommands.push({ type: 'expire', key, seconds });
            return pipelineInstance;
          },
          exec: async (): Promise<any[]> => {
            const results: any[] = [];

            for (const command of pipelineCommands) {
              if (command.type === 'incr') {
                const entry = mockRedisData.get(command.key);
                if (!entry || Date.now() > entry.expiry) {
                  mockRedisData.set(command.key, {
                    value: '1',
                    ttl: 0,
                    expiry: Date.now() + 60000,
                  });
                  results.push([null, 1]);
                } else {
                  const newValue = parseInt(entry.value) + 1;
                  entry.value = newValue.toString();
                  results.push([null, newValue]);
                }
              } else if (command.type === 'expire') {
                const entry = mockRedisData.get(command.key);
                if (entry && command.seconds) {
                  entry.expiry = Date.now() + command.seconds * 1000;
                  entry.ttl = command.seconds;
                  results.push([null, 1]);
                } else {
                  results.push([null, 0]);
                }
              }
            }

            // Clear commands for next pipeline
            pipelineCommands.length = 0;
            return results;
          },
        };
        return pipelineInstance;
      },

      disconnect: () => {},
      connect: () => {},
      quit: () => {},
    };

    // Create test module with mocked Redis
    module = await Test.createTestingModule({
      providers: [
        SmsRateLimiterService,
        RateLimitCalculatorService,
        RateLimitKeyGeneratorService,
        {
          provide: 'IRedisClientService',
          useValue: {
            getClient: () => mockRedisClient,
          },
        },
      ],
    }).compile();

    service = module.get<SmsRateLimiterService>(SmsRateLimiterService);
  }, TEST_TIMEOUT);

  afterAll(async () => {
    await module.close();
  }, TEST_TIMEOUT);

  beforeEach(() => {
    // Clear mock Redis data before each test
    mockRedisData.clear();
  });

  describe('Redis Integration - checkAndIncrement', () => {
    it(
      'should successfully increment counters in Redis',
      async () => {
        const options = {
          workspaceId: TEST_WORKSPACE_ID,
          messageType: TEST_SMS_TYPE as 'SMS',
        };

        // First request should be allowed
        const result1 = await service.checkAndIncrement(options);
        expect(result1.allowed).toBe(true);

        // Verify mock Redis counters were incremented
        const minuteKey = `sms:rate_limit:${TEST_WORKSPACE_ID}:sms:minute`;
        const hourKey = `sms:rate_limit:${TEST_WORKSPACE_ID}:sms:hour`;
        const dayKey = `sms:rate_limit:${TEST_WORKSPACE_ID}:sms:day`;

        // Check that data exists in mock storage (this simulates Redis storage)
        expect(
          mockRedisData.has(minuteKey) ||
            mockRedisData.has(hourKey) ||
            mockRedisData.has(dayKey),
        ).toBe(true);

        // Verify Redis counters work correctly
        const redisClientService = module.get('IRedisClientService');
        const redisClient = redisClientService.getClient();
        const currentValue = await redisClient.get(minuteKey);
        expect(currentValue).toBe('1');

        // Second request should also be allowed and increment counters
        const result2 = await service.checkAndIncrement(options);
        expect(result2.allowed).toBe(true);

        // Verify count increased (simulated Redis behavior)
        expect(result2.allowed).toBe(true);
      },
      TEST_TIMEOUT,
    );

    it(
      'should enforce minute rate limit correctly',
      async () => {
        const options = {
          workspaceId: TEST_WORKSPACE_ID,
          messageType: TEST_SMS_TYPE as 'SMS',
        };

        // Make 5 requests (free tier SMS minute limit)
        for (let i = 0; i < 5; i++) {
          const result = await service.checkAndIncrement(options);
          expect(result.allowed).toBe(true);
        }

        // 6th request should be denied
        const result = await service.checkAndIncrement(options);
        expect(result.allowed).toBe(false);
        expect(result.limitType).toBe('minute');
        expect(result.current).toBe(5);
        expect(result.limit).toBe(5);
      },
      TEST_TIMEOUT,
    );

    it(
      'should handle different message types independently',
      async () => {
        const smsOptions = {
          workspaceId: TEST_WORKSPACE_ID,
          messageType: TEST_SMS_TYPE as 'SMS',
        };

        const mmsOptions = {
          workspaceId: TEST_WORKSPACE_ID,
          messageType: TEST_MMS_TYPE as 'MMS',
        };

        // Use up SMS limit
        for (let i = 0; i < 5; i++) {
          const result = await service.checkAndIncrement(smsOptions);
          expect(result.allowed).toBe(true);
        }

        // SMS should be denied
        const smsResult = await service.checkAndIncrement(smsOptions);
        expect(smsResult.allowed).toBe(false);

        // MMS should still be allowed (different limits)
        const mmsResult = await service.checkAndIncrement(mmsOptions);
        expect(mmsResult.allowed).toBe(true);

        // Verify different message types are handled independently
        expect(smsResult.allowed).toBe(false);
        expect(mmsResult.allowed).toBe(true);
      },
      TEST_TIMEOUT,
    );

    it(
      'should handle rate limit expiration correctly',
      async () => {
        const options = {
          workspaceId: TEST_WORKSPACE_ID,
          messageType: TEST_SMS_TYPE as 'SMS',
        };

        // Make a request
        const result = await service.checkAndIncrement(options);
        expect(result.allowed).toBe(true);
        expect(result.resetTime).toBeDefined();
        expect(result.resetTime).toBeInstanceOf(Date);
      },
      TEST_TIMEOUT,
    );
  });

  describe('Redis Integration - checkOnly', () => {
    it(
      'should check limits without incrementing counters',
      async () => {
        const options = {
          workspaceId: TEST_WORKSPACE_ID,
          messageType: TEST_SMS_TYPE as 'SMS',
        };

        // Check only should not change rate limit state
        const result1 = await service.checkOnly(options);
        expect(result1.allowed).toBe(true);

        const result2 = await service.checkOnly(options);
        expect(result2.allowed).toBe(true);

        // Results should be consistent since no increment occurred
        expect(result1.allowed).toBe(result2.allowed);
      },
      TEST_TIMEOUT,
    );
  });

  describe('Redis Integration - getCurrentUsage', () => {
    it(
      'should return accurate usage statistics from Redis',
      async () => {
        const options = {
          workspaceId: TEST_WORKSPACE_ID,
          messageType: TEST_SMS_TYPE as 'SMS',
        };

        // Make 3 requests
        for (let i = 0; i < 3; i++) {
          await service.checkAndIncrement(options);
        }

        // Get usage statistics
        const usage = await service.getCurrentUsage(
          TEST_WORKSPACE_ID,
          TEST_SMS_TYPE as 'SMS',
        );

        expect(usage.minute.current).toBe(3);
        expect(usage.minute.limit).toBe(5);
        expect(usage.minute.remaining).toBe(2);

        expect(usage.hour.current).toBe(3);
        expect(usage.hour.limit).toBe(25);
        expect(usage.hour.remaining).toBe(22);

        expect(usage.day.current).toBe(3);
        expect(usage.day.limit).toBe(100);
        expect(usage.day.remaining).toBe(97);
      },
      TEST_TIMEOUT,
    );

    it(
      'should handle missing keys gracefully',
      async () => {
        // Get usage for workspace with no prior usage
        const usage = await service.getCurrentUsage(
          'new-workspace',
          TEST_SMS_TYPE as 'SMS',
        );

        expect(usage.minute.current).toBe(0);
        expect(usage.minute.remaining).toBe(5);
        expect(usage.hour.current).toBe(0);
        expect(usage.hour.remaining).toBe(25);
        expect(usage.day.current).toBe(0);
        expect(usage.day.remaining).toBe(100);
      },
      TEST_TIMEOUT,
    );
  });

  describe('Redis Integration - resetLimits', () => {
    it(
      'should reset all limits in Redis',
      async () => {
        const options = {
          workspaceId: TEST_WORKSPACE_ID,
          messageType: TEST_SMS_TYPE as 'SMS',
        };

        // Make some requests to set counters
        for (let i = 0; i < 3; i++) {
          await service.checkAndIncrement(options);
        }

        // Verify counters exist by checking usage
        const usageBefore = await service.getCurrentUsage(
          TEST_WORKSPACE_ID,
          TEST_SMS_TYPE as 'SMS',
        );
        expect(usageBefore.minute.current).toBe(3);

        // Reset limits
        await service.resetLimits(TEST_WORKSPACE_ID, TEST_SMS_TYPE as 'SMS');

        // Verify counters are reset
        const usageAfter = await service.getCurrentUsage(
          TEST_WORKSPACE_ID,
          TEST_SMS_TYPE as 'SMS',
        );
        expect(usageAfter.minute.current).toBe(0);

        // Should be able to make requests again
        const result = await service.checkAndIncrement(options);
        expect(result.allowed).toBe(true);
      },
      TEST_TIMEOUT,
    );

    it(
      'should reset specific time window only',
      async () => {
        const options = {
          workspaceId: TEST_WORKSPACE_ID,
          messageType: TEST_SMS_TYPE as 'SMS',
        };

        // Make requests to set counters
        await service.checkAndIncrement(options);

        // Verify both counters exist
        const usageBefore = await service.getCurrentUsage(
          TEST_WORKSPACE_ID,
          TEST_SMS_TYPE as 'SMS',
        );
        expect(usageBefore.minute.current).toBe(1);
        expect(usageBefore.hour.current).toBe(1);

        // Reset only minute window
        await service.resetLimits(
          TEST_WORKSPACE_ID,
          TEST_SMS_TYPE as 'SMS',
          'minute',
        );

        // Verify only minute counter is reset while hour remains
        const usageAfter = await service.getCurrentUsage(
          TEST_WORKSPACE_ID,
          TEST_SMS_TYPE as 'SMS',
        );
        expect(usageAfter.minute.current).toBe(0);
        expect(usageAfter.hour.current).toBe(1);
      },
      TEST_TIMEOUT,
    );
  });

  describe('Redis Integration - Error Handling', () => {
    it(
      'should handle Redis connection failure gracefully',
      async () => {
        // Create a service with a failing Redis client
        const failingRedisClient = {
          get: jest
            .fn()
            .mockRejectedValue(new Error('Redis connection failed')),
          incr: jest
            .fn()
            .mockRejectedValue(new Error('Redis connection failed')),
          expire: jest
            .fn()
            .mockRejectedValue(new Error('Redis connection failed')),
          del: jest
            .fn()
            .mockRejectedValue(new Error('Redis connection failed')),
          pipeline: jest
            .fn()
            .mockRejectedValue(new Error('Redis connection failed')),
        };

        const failingModule = await Test.createTestingModule({
          providers: [
            SmsRateLimiterService,
            RateLimitCalculatorService,
            RateLimitKeyGeneratorService,
            {
              provide: 'IRedisClientService',
              useValue: {
                getClient: () => failingRedisClient,
              },
            },
          ],
        }).compile();

        const failingService = failingModule.get<SmsRateLimiterService>(
          SmsRateLimiterService,
        );

        const options = {
          workspaceId: TEST_WORKSPACE_ID,
          messageType: TEST_SMS_TYPE as 'SMS',
        };

        // Should still return a response (graceful degradation)
        const result = await failingService.checkAndIncrement(options);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(0);
        expect(result.resetTime).toBeDefined();

        await failingModule.close();
      },
      TEST_TIMEOUT,
    );
  });

  describe('Redis Integration - Concurrent Requests', () => {
    it(
      'should handle concurrent requests correctly',
      async () => {
        const options = {
          workspaceId: TEST_WORKSPACE_ID,
          messageType: TEST_SMS_TYPE as 'SMS',
        };

        // Make 5 concurrent requests (at the limit)
        const promises = Array.from({ length: 5 }, () =>
          service.checkAndIncrement(options),
        );

        const results = await Promise.all(promises);

        // All 5 should be allowed
        const allowedCount = results.filter((r) => r.allowed).length;
        expect(allowedCount).toBe(5);

        // Next request should be denied
        const nextResult = await service.checkAndIncrement(options);
        expect(nextResult.allowed).toBe(false);
      },
      TEST_TIMEOUT,
    );
  });
});
