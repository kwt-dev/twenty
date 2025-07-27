import { Test, TestingModule } from '@nestjs/testing';
import {
  SmsRateLimiterService,
  IRedisClientService,
} from '../../services/sms-rate-limiter.service';
import { RateLimitKeyGeneratorService } from '../../utils/rate-limiting/rate-limit-key-generator';
import { RateLimitCalculatorService } from '../../utils/rate-limiting/rate-limit-calculator';

// Test constants
const TEST_WORKSPACE_ID = 'test-workspace-123';
const TEST_WORKSPACE_ID_PREMIUM = 'premium-workspace-456';
const TEST_SMS_TYPE = 'SMS';
const TEST_MMS_TYPE = 'MMS';
const MINUTE_WINDOW = 'minute';
const HOUR_WINDOW = 'hour';
const DAY_WINDOW = 'day';
const DEFAULT_TTL_MINUTE = 60;
const DEFAULT_TTL_HOUR = 3600;
const DEFAULT_TTL_DAY = 86400;
const FREE_TIER_SMS_MINUTE_LIMIT = 5;
const FREE_TIER_SMS_HOUR_LIMIT = 25;
const FREE_TIER_SMS_DAY_LIMIT = 100;
const PREMIUM_TIER_SMS_MINUTE_LIMIT = 30;

describe('RateLimitKeyGeneratorService', () => {
  let service: RateLimitKeyGeneratorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RateLimitKeyGeneratorService],
    }).compile();

    service = module.get<RateLimitKeyGeneratorService>(
      RateLimitKeyGeneratorService,
    );
  });

  describe('generateKey', () => {
    it('should generate correct Redis key format', () => {
      const options = {
        workspaceId: TEST_WORKSPACE_ID,
        messageType: TEST_SMS_TYPE as 'SMS',
        timeWindow: MINUTE_WINDOW as 'minute',
      };

      const result = service.generateKey(options);

      expect(result).toBe('sms:rate_limit:test-workspace-123:sms:minute');
    });

    it('should handle MMS message type correctly', () => {
      const options = {
        workspaceId: TEST_WORKSPACE_ID,
        messageType: TEST_MMS_TYPE as 'MMS',
        timeWindow: HOUR_WINDOW as 'hour',
      };

      const result = service.generateKey(options);

      expect(result).toBe('sms:rate_limit:test-workspace-123:mms:hour');
    });
  });

  describe('generateKeys', () => {
    it('should generate keys for all time windows', () => {
      const result = service.generateKeys(
        TEST_WORKSPACE_ID,
        TEST_SMS_TYPE as 'SMS',
      );

      expect(result).toHaveLength(3);
      expect(result).toContain('sms:rate_limit:test-workspace-123:sms:minute');
      expect(result).toContain('sms:rate_limit:test-workspace-123:sms:hour');
      expect(result).toContain('sms:rate_limit:test-workspace-123:sms:day');
    });
  });

  describe('parseKey', () => {
    it('should parse valid Redis key correctly', () => {
      const key = 'sms:rate_limit:test-workspace-123:sms:minute';

      const result = service.parseKey(key);

      expect(result).toEqual({
        workspaceId: TEST_WORKSPACE_ID,
        messageType: TEST_SMS_TYPE,
        timeWindow: MINUTE_WINDOW,
      });
    });

    it('should return null for invalid key format', () => {
      const invalidKey = 'invalid:key:format';

      const result = service.parseKey(invalidKey);

      expect(result).toBeNull();
    });

    it('should return null for invalid message type', () => {
      const invalidKey = 'sms:rate_limit:test-workspace-123:INVALID:minute';

      const result = service.parseKey(invalidKey);

      expect(result).toBeNull();
    });
  });
});

describe('RateLimitCalculatorService', () => {
  let service: RateLimitCalculatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RateLimitCalculatorService],
    }).compile();

    service = module.get<RateLimitCalculatorService>(
      RateLimitCalculatorService,
    );
  });

  describe('getLimits', () => {
    it('should return free tier limits for default workspace', () => {
      const result = service.getLimits(
        TEST_WORKSPACE_ID,
        TEST_SMS_TYPE as 'SMS',
      );

      expect(result).toEqual({
        minute: FREE_TIER_SMS_MINUTE_LIMIT,
        hour: FREE_TIER_SMS_HOUR_LIMIT,
        day: FREE_TIER_SMS_DAY_LIMIT,
      });
    });

    it('should return premium tier limits for premium workspace', () => {
      const result = service.getLimits(
        TEST_WORKSPACE_ID_PREMIUM,
        TEST_SMS_TYPE as 'SMS',
      );

      expect(result).toEqual({
        minute: PREMIUM_TIER_SMS_MINUTE_LIMIT,
        hour: 150,
        day: 600,
      });
    });
  });

  describe('calculateTTL', () => {
    it('should return correct TTL for minute window', () => {
      const result = service.calculateTTL(MINUTE_WINDOW as 'minute');
      expect(result).toBe(DEFAULT_TTL_MINUTE);
    });

    it('should return correct TTL for hour window', () => {
      const result = service.calculateTTL(HOUR_WINDOW as 'hour');
      expect(result).toBe(DEFAULT_TTL_HOUR);
    });

    it('should return correct TTL for day window', () => {
      const result = service.calculateTTL(DAY_WINDOW as 'day');
      expect(result).toBe(DEFAULT_TTL_DAY);
    });
  });

  describe('calculateRemaining', () => {
    it('should calculate correct remaining quota', () => {
      const current = 3;
      const limit = 10;

      const result = service.calculateRemaining(current, limit);

      expect(result).toBe(7);
    });

    it('should return zero when limit exceeded', () => {
      const current = 15;
      const limit = 10;

      const result = service.calculateRemaining(current, limit);

      expect(result).toBe(0);
    });
  });

  describe('isLimitExceeded', () => {
    it('should return true when limit is exceeded', () => {
      const current = 10;
      const limit = 5;

      const result = service.isLimitExceeded(current, limit);

      expect(result).toBe(true);
    });

    it('should return false when within limit', () => {
      const current = 3;
      const limit = 5;

      const result = service.isLimitExceeded(current, limit);

      expect(result).toBe(false);
    });

    it('should return true when at exact limit', () => {
      const current = 5;
      const limit = 5;

      const result = service.isLimitExceeded(current, limit);

      expect(result).toBe(true);
    });
  });

  describe('calculateResetTime', () => {
    it('should calculate correct reset time for minute window', () => {
      const now = new Date('2023-01-01T10:30:45.123Z');
      jest.useFakeTimers().setSystemTime(now);

      const result = service.calculateResetTime(MINUTE_WINDOW as 'minute');

      expect(result).toEqual(new Date('2023-01-01T10:31:00.000Z'));

      jest.useRealTimers();
    });

    it('should calculate correct reset time for hour window', () => {
      const now = new Date('2023-01-01T10:30:45.123Z');
      jest.useFakeTimers().setSystemTime(now);

      const result = service.calculateResetTime(HOUR_WINDOW as 'hour');

      expect(result).toEqual(new Date('2023-01-01T11:00:00.000Z'));

      jest.useRealTimers();
    });

    it('should calculate correct reset time for day window', () => {
      const now = new Date('2023-01-01T10:30:45.123Z');
      jest.useFakeTimers().setSystemTime(now);

      const result = service.calculateResetTime(DAY_WINDOW as 'day');

      // Check that the result is the next day at midnight in the local timezone
      expect(result.getDate()).toBe(2);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);

      jest.useRealTimers();
    });
  });
});

describe('SmsRateLimiterService', () => {
  let service: SmsRateLimiterService;
  let redisClientService: jest.Mocked<IRedisClientService>;
  let rateLimitCalculator: RateLimitCalculatorService;
  let keyGenerator: RateLimitKeyGeneratorService;
  let mockRedisClient: any;

  beforeEach(async () => {
    mockRedisClient = {
      get: jest.fn(),
      incr: jest.fn(),
      expire: jest.fn(),
      del: jest.fn(),
      pipeline: jest.fn(() => ({
        incr: jest.fn(),
        expire: jest.fn(),
        exec: jest.fn().mockResolvedValue([]),
      })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmsRateLimiterService,
        RateLimitCalculatorService,
        RateLimitKeyGeneratorService,
        {
          provide: 'IRedisClientService',
          useValue: {
            getClient: jest.fn(() => mockRedisClient),
          },
        },
      ],
    }).compile();

    service = module.get<SmsRateLimiterService>(SmsRateLimiterService);
    redisClientService = module.get('IRedisClientService');
    rateLimitCalculator = module.get<RateLimitCalculatorService>(
      RateLimitCalculatorService,
    );
    keyGenerator = module.get<RateLimitKeyGeneratorService>(
      RateLimitKeyGeneratorService,
    );
  });

  describe('checkAndIncrement', () => {
    it('should allow request when within all limits', async () => {
      mockRedisClient.get.mockResolvedValue('2'); // Current usage below limit

      const options = {
        workspaceId: TEST_WORKSPACE_ID,
        messageType: TEST_SMS_TYPE as 'SMS',
      };

      const result = await service.checkAndIncrement(options);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeGreaterThan(0);
      expect(result.resetTime).toBeDefined();
    });

    it('should deny request when minute limit exceeded', async () => {
      mockRedisClient.get
        .mockResolvedValueOnce('5') // Minute limit exceeded
        .mockResolvedValueOnce('20') // Hour limit OK
        .mockResolvedValueOnce('80'); // Day limit OK

      const options = {
        workspaceId: TEST_WORKSPACE_ID,
        messageType: TEST_SMS_TYPE as 'SMS',
      };

      const result = await service.checkAndIncrement(options);

      expect(result.allowed).toBe(false);
      expect(result.limitType).toBe(MINUTE_WINDOW);
      expect(result.current).toBe(FREE_TIER_SMS_MINUTE_LIMIT);
      expect(result.limit).toBe(FREE_TIER_SMS_MINUTE_LIMIT);
    });

    it('should deny request when hour limit exceeded', async () => {
      mockRedisClient.get
        .mockResolvedValueOnce('3') // Minute limit OK
        .mockResolvedValueOnce('25') // Hour limit exceeded
        .mockResolvedValueOnce('80'); // Day limit OK

      const options = {
        workspaceId: TEST_WORKSPACE_ID,
        messageType: TEST_SMS_TYPE as 'SMS',
      };

      const result = await service.checkAndIncrement(options);

      expect(result.allowed).toBe(false);
      expect(result.limitType).toBe(HOUR_WINDOW);
      expect(result.current).toBe(FREE_TIER_SMS_HOUR_LIMIT);
      expect(result.limit).toBe(FREE_TIER_SMS_HOUR_LIMIT);
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedisClient.get.mockRejectedValue(
        new Error('Redis connection failed'),
      );

      const options = {
        workspaceId: TEST_WORKSPACE_ID,
        messageType: TEST_SMS_TYPE as 'SMS',
      };

      const result = await service.checkAndIncrement(options);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(0);
      expect(result.resetTime).toBeDefined();
    });

    it('should increment all counters when request is allowed', async () => {
      mockRedisClient.get.mockResolvedValue('1'); // Under all limits
      const mockPipeline = {
        incr: jest.fn(),
        expire: jest.fn(),
        exec: jest.fn().mockResolvedValue([]),
      };
      mockRedisClient.pipeline.mockReturnValue(mockPipeline);

      const options = {
        workspaceId: TEST_WORKSPACE_ID,
        messageType: TEST_SMS_TYPE as 'SMS',
      };

      await service.checkAndIncrement(options);

      expect(mockPipeline.incr).toHaveBeenCalledTimes(3); // minute, hour, day
      expect(mockPipeline.expire).toHaveBeenCalledTimes(3);
      expect(mockPipeline.exec).toHaveBeenCalledTimes(1);
    });
  });

  describe('checkOnly', () => {
    it('should check limits without incrementing', async () => {
      mockRedisClient.get.mockResolvedValue('2'); // Under limit

      const options = {
        workspaceId: TEST_WORKSPACE_ID,
        messageType: TEST_SMS_TYPE as 'SMS',
      };

      const result = await service.checkOnly(options);

      expect(result.allowed).toBe(true);
      expect(mockRedisClient.incr).not.toHaveBeenCalled();
      expect(mockRedisClient.pipeline).not.toHaveBeenCalled();
    });
  });

  describe('getCurrentUsage', () => {
    it('should return current usage statistics', async () => {
      mockRedisClient.get
        .mockResolvedValueOnce('2') // Minute usage
        .mockResolvedValueOnce('15') // Hour usage
        .mockResolvedValueOnce('75'); // Day usage

      const result = await service.getCurrentUsage(
        TEST_WORKSPACE_ID,
        TEST_SMS_TYPE as 'SMS',
      );

      expect(result).toEqual({
        minute: { current: 2, limit: FREE_TIER_SMS_MINUTE_LIMIT, remaining: 3 },
        hour: { current: 15, limit: FREE_TIER_SMS_HOUR_LIMIT, remaining: 10 },
        day: { current: 75, limit: FREE_TIER_SMS_DAY_LIMIT, remaining: 25 },
      });
    });

    it('should handle missing Redis values', async () => {
      mockRedisClient.get.mockResolvedValue(null); // No usage recorded

      const result = await service.getCurrentUsage(
        TEST_WORKSPACE_ID,
        TEST_SMS_TYPE as 'SMS',
      );

      expect(result).toEqual({
        minute: {
          current: 0,
          limit: FREE_TIER_SMS_MINUTE_LIMIT,
          remaining: FREE_TIER_SMS_MINUTE_LIMIT,
        },
        hour: {
          current: 0,
          limit: FREE_TIER_SMS_HOUR_LIMIT,
          remaining: FREE_TIER_SMS_HOUR_LIMIT,
        },
        day: {
          current: 0,
          limit: FREE_TIER_SMS_DAY_LIMIT,
          remaining: FREE_TIER_SMS_DAY_LIMIT,
        },
      });
    });
  });

  describe('resetLimits', () => {
    it('should reset all limits when no time window specified', async () => {
      await service.resetLimits(TEST_WORKSPACE_ID, TEST_SMS_TYPE as 'SMS');

      expect(mockRedisClient.del).toHaveBeenCalledWith(
        'sms:rate_limit:test-workspace-123:sms:minute',
        'sms:rate_limit:test-workspace-123:sms:hour',
        'sms:rate_limit:test-workspace-123:sms:day',
      );
    });

    it('should reset specific time window when specified', async () => {
      await service.resetLimits(
        TEST_WORKSPACE_ID,
        TEST_SMS_TYPE as 'SMS',
        MINUTE_WINDOW as 'minute',
      );

      expect(mockRedisClient.del).toHaveBeenCalledWith(
        'sms:rate_limit:test-workspace-123:sms:minute',
      );
    });

    it('should handle Redis errors during reset', async () => {
      mockRedisClient.del.mockRejectedValue(new Error('Redis delete failed'));

      await expect(
        service.resetLimits(TEST_WORKSPACE_ID, TEST_SMS_TYPE as 'SMS'),
      ).rejects.toThrow('Failed to reset rate limits');
    });
  });
});
