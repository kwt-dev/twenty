import { Test, TestingModule } from '@nestjs/testing';
import { SmsRateLimiterService } from '../../services/sms-rate-limiter.service';
import { RateLimitKeyGeneratorService } from '../../utils/rate-limiting/rate-limit-key-generator';
import { RateLimitCalculatorService } from '../../utils/rate-limiting/rate-limit-calculator';
// RedisClientService now imported from Twenty's core modules

describe('Redis Injection Token Fix', () => {
  let service: SmsRateLimiterService;
  // let redisService: RedisClientService;
  let module: TestingModule;

  beforeAll(async () => {
    // Mock Redis client
    const mockRedisClient = {
      incr: jest.fn().mockResolvedValue(1),
      expire: jest.fn().mockResolvedValue(1),
      get: jest.fn().mockResolvedValue('1'),
      del: jest.fn().mockResolvedValue(1),
      pipeline: jest.fn().mockReturnValue({
        incr: jest.fn().mockReturnThis(),
        expire: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      }),
    };

    // Mock RedisClientService - this should be the interface, not the class
    const mockRedisService = {
      getClient: jest.fn().mockReturnValue(mockRedisClient),
      isConnected: jest.fn().mockReturnValue(true),
    };

    module = await Test.createTestingModule({
      providers: [
        SmsRateLimiterService,
        RateLimitCalculatorService,
        RateLimitKeyGeneratorService,
        // Test the actual injection token configuration
        {
          provide: 'IRedisClientService',
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<SmsRateLimiterService>(SmsRateLimiterService);
    // redisService = module.get<RedisClientService>(RedisClientService);
  });

  afterAll(async () => {
    await module.close();
  });

  describe('Injection Token Configuration', () => {
    it('should successfully inject RedisClientService via IRedisClientService token', async () => {
      expect(service).toBeDefined();

      // Test that the service can call Redis methods without "undefined" errors
      const result = await service.checkAndIncrement({
        workspaceId: 'test-workspace',
        messageType: 'SMS',
      });

      expect(result).toBeDefined();
      expect(result.allowed).toBe(true);
    });

    it('should not throw "Cannot read properties of undefined" error', async () => {
      // This test specifically verifies the injection token fix
      await expect(
        service.checkAndIncrement({
          workspaceId: 'test-workspace',
          messageType: 'SMS',
        }),
      ).resolves.not.toThrow();
    });
  });
});
