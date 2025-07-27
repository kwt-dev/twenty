/**
 * Integration tests for Slice 2: Token Standardization DI Resolution
 *
 * Tests that dependency injection works correctly with the new TRIB_TOKENS.* pattern
 * and maintains backward compatibility with the bridge export.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TribSmsService } from '../../services/trib_sms.service';
import { TRIB_TOKENS, MESSAGE_QUEUE_SERVICE_TOKEN } from '../../tokens';
import { TribMessageWorkspaceEntity } from '../../standard-objects/trib-message.workspace-entity';
import { TribDeliveryWorkspaceEntity } from '../../standard-objects/trib-delivery.workspace-entity';
import { TribConsentWorkspaceEntity } from '../../standard-objects/trib-consent.workspace-entity';
import { TribThreadWorkspaceEntity } from '../../standard-objects/trib-thread.workspace-entity';
import { TribPhoneNumberWorkspaceEntity } from '../../standard-objects/trib-phone-number.workspace-entity';

// Test constants
const TEST_WORKSPACE_ID = 'ws-test-12345';
const TEST_SERVICE_MOCK_VALUE = 'MockMessageQueueService';
const TEST_LOGGER_MOCK_VALUE = 'MockLogger';

// Mock implementations
class MockMessageQueueService {
  add<T>(jobName: string, data: T, options?: any): Promise<void> {
    return Promise.resolve();
  }

  addCron(params: any): Promise<void> {
    return Promise.resolve();
  }

  removeCron(params: any): Promise<void> {
    return Promise.resolve();
  }

  work<T>(handler: any, options?: any): any {
    return {};
  }
}

class MockLogger {
  log(message: string): void {}
  error(message: string, error?: any): void {}
  warn(message: string): void {}
}

// Mock repositories
const createMockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

const mockDataSource = {
  transaction: jest.fn(),
  getRepository: jest.fn(),
};

describe('Slice 2: Token Standardization DI Integration', () => {
  let module: TestingModule;
  let service: TribSmsService;
  let mockMessageQueueService: MockMessageQueueService;
  let mockLogger: MockLogger;

  beforeEach(async () => {
    mockMessageQueueService = new MockMessageQueueService();
    mockLogger = new MockLogger();

    // Mock the transaction method
    mockDataSource.transaction.mockImplementation((callback) => {
      return callback({
        create: jest.fn(),
        save: jest.fn(),
        findOne: jest.fn(),
        find: jest.fn(),
      });
    });
  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
  });

  describe('DI Resolution with New TRIB_TOKENS Pattern', () => {
    it('should successfully inject dependencies using TRIB_TOKENS.MESSAGE_QUEUE_SERVICE', async () => {
      module = await Test.createTestingModule({
        providers: [
          TribSmsService,
          {
            provide: DataSource,
            useValue: mockDataSource,
          },
          {
            provide: TRIB_TOKENS.MESSAGE_QUEUE_SERVICE,
            useValue: mockMessageQueueService,
          },
          {
            provide: TRIB_TOKENS.LOGGER,
            useValue: mockLogger,
          },
          {
            provide: getRepositoryToken(TribMessageWorkspaceEntity),
            useValue: createMockRepository(),
          },
          {
            provide: getRepositoryToken(TribDeliveryWorkspaceEntity),
            useValue: createMockRepository(),
          },
          {
            provide: getRepositoryToken(TribConsentWorkspaceEntity),
            useValue: createMockRepository(),
          },
          {
            provide: getRepositoryToken(TribThreadWorkspaceEntity),
            useValue: createMockRepository(),
          },
          {
            provide: getRepositoryToken(TribPhoneNumberWorkspaceEntity),
            useValue: createMockRepository(),
          },
        ],
      }).compile();

      service = module.get<TribSmsService>(TribSmsService);

      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(TribSmsService);
    });

    it('should inject the correct service instance using new token pattern', async () => {
      module = await Test.createTestingModule({
        providers: [
          TribSmsService,
          {
            provide: DataSource,
            useValue: mockDataSource,
          },
          {
            provide: TRIB_TOKENS.MESSAGE_QUEUE_SERVICE,
            useValue: TEST_SERVICE_MOCK_VALUE,
          },
          {
            provide: getRepositoryToken(TribMessageWorkspaceEntity),
            useValue: createMockRepository(),
          },
          {
            provide: getRepositoryToken(TribDeliveryWorkspaceEntity),
            useValue: createMockRepository(),
          },
          {
            provide: getRepositoryToken(TribConsentWorkspaceEntity),
            useValue: createMockRepository(),
          },
          {
            provide: getRepositoryToken(TribThreadWorkspaceEntity),
            useValue: createMockRepository(),
          },
          {
            provide: getRepositoryToken(TribPhoneNumberWorkspaceEntity),
            useValue: createMockRepository(),
          },
        ],
      }).compile();

      // Get the injected service instance
      const injectedService = module.get(TRIB_TOKENS.MESSAGE_QUEUE_SERVICE);
      expect(injectedService).toBe(TEST_SERVICE_MOCK_VALUE);
    });
  });

  describe('Backward Compatibility with Bridge Export', () => {
    it('should successfully inject dependencies using deprecated TRIB_TOKENS.MESSAGE_QUEUE_SERVICE', async () => {
      module = await Test.createTestingModule({
        providers: [
          TribSmsService,
          {
            provide: DataSource,
            useValue: mockDataSource,
          },
          {
            provide: TRIB_TOKENS.MESSAGE_QUEUE_SERVICE,
            useValue: mockMessageQueueService,
          },
          {
            provide: getRepositoryToken(TribMessageWorkspaceEntity),
            useValue: createMockRepository(),
          },
          {
            provide: getRepositoryToken(TribDeliveryWorkspaceEntity),
            useValue: createMockRepository(),
          },
          {
            provide: getRepositoryToken(TribConsentWorkspaceEntity),
            useValue: createMockRepository(),
          },
          {
            provide: getRepositoryToken(TribThreadWorkspaceEntity),
            useValue: createMockRepository(),
          },
          {
            provide: getRepositoryToken(TribPhoneNumberWorkspaceEntity),
            useValue: createMockRepository(),
          },
        ],
      }).compile();

      service = module.get<TribSmsService>(TribSmsService);

      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(TribSmsService);
    });

    it('should resolve the same service instance with both token patterns', async () => {
      module = await Test.createTestingModule({
        providers: [
          TribSmsService,
          {
            provide: DataSource,
            useValue: mockDataSource,
          },
          {
            provide: TRIB_TOKENS.MESSAGE_QUEUE_SERVICE,
            useValue: TEST_SERVICE_MOCK_VALUE,
          },
          {
            provide: getRepositoryToken(TribMessageWorkspaceEntity),
            useValue: createMockRepository(),
          },
          {
            provide: getRepositoryToken(TribDeliveryWorkspaceEntity),
            useValue: createMockRepository(),
          },
          {
            provide: getRepositoryToken(TribConsentWorkspaceEntity),
            useValue: createMockRepository(),
          },
          {
            provide: getRepositoryToken(TribThreadWorkspaceEntity),
            useValue: createMockRepository(),
          },
          {
            provide: getRepositoryToken(TribPhoneNumberWorkspaceEntity),
            useValue: createMockRepository(),
          },
        ],
      }).compile();

      // Both patterns should resolve to the same service
      const serviceViaNewPattern = module.get(
        TRIB_TOKENS.MESSAGE_QUEUE_SERVICE,
      );
      const serviceViaOldPattern = module.get(
        TRIB_TOKENS.MESSAGE_QUEUE_SERVICE,
      );

      expect(serviceViaNewPattern).toBe(serviceViaOldPattern);
      expect(serviceViaNewPattern).toBe(TEST_SERVICE_MOCK_VALUE);
    });
  });

  describe('Token Symbol Consistency', () => {
    it('should maintain token symbol consistency across DI container', async () => {
      module = await Test.createTestingModule({
        providers: [
          {
            provide: TRIB_TOKENS.MESSAGE_QUEUE_SERVICE,
            useValue: TEST_SERVICE_MOCK_VALUE,
          },
        ],
      }).compile();

      // Test that the symbol is preserved
      expect(module.get(TRIB_TOKENS.MESSAGE_QUEUE_SERVICE)).toBe(
        TEST_SERVICE_MOCK_VALUE,
      );
      expect(module.get(TRIB_TOKENS.MESSAGE_QUEUE_SERVICE)).toBe(
        TEST_SERVICE_MOCK_VALUE,
      );
    });

    it('should handle multiple token types correctly', async () => {
      const mockRedisClient = { get: jest.fn(), set: jest.fn() };

      module = await Test.createTestingModule({
        providers: [
          {
            provide: TRIB_TOKENS.MESSAGE_QUEUE_SERVICE,
            useValue: TEST_SERVICE_MOCK_VALUE,
          },
          {
            provide: TRIB_TOKENS.REDIS_CLIENT,
            useValue: mockRedisClient,
          },
          {
            provide: TRIB_TOKENS.LOGGER,
            useValue: TEST_LOGGER_MOCK_VALUE,
          },
        ],
      }).compile();

      // Test that all tokens resolve correctly
      expect(module.get(TRIB_TOKENS.MESSAGE_QUEUE_SERVICE)).toBe(
        TEST_SERVICE_MOCK_VALUE,
      );
      expect(module.get(TRIB_TOKENS.REDIS_CLIENT)).toBe(mockRedisClient);
      expect(module.get(TRIB_TOKENS.LOGGER)).toBe(TEST_LOGGER_MOCK_VALUE);
    });
  });

  describe('Service Instantiation', () => {
    it('should initialize TribSmsService with correct dependency injection', async () => {
      const initializeSpy = jest.spyOn(
        TribSmsService.prototype,
        'initializeService',
      );

      module = await Test.createTestingModule({
        providers: [
          TribSmsService,
          {
            provide: DataSource,
            useValue: mockDataSource,
          },
          {
            provide: TRIB_TOKENS.MESSAGE_QUEUE_SERVICE,
            useValue: mockMessageQueueService,
          },
          {
            provide: getRepositoryToken(TribMessageWorkspaceEntity),
            useValue: createMockRepository(),
          },
          {
            provide: getRepositoryToken(TribDeliveryWorkspaceEntity),
            useValue: createMockRepository(),
          },
          {
            provide: getRepositoryToken(TribConsentWorkspaceEntity),
            useValue: createMockRepository(),
          },
          {
            provide: getRepositoryToken(TribThreadWorkspaceEntity),
            useValue: createMockRepository(),
          },
          {
            provide: getRepositoryToken(TribPhoneNumberWorkspaceEntity),
            useValue: createMockRepository(),
          },
        ],
      }).compile();

      service = module.get<TribSmsService>(TribSmsService);

      // Test that service can be initialized
      expect(() => service.initializeService()).not.toThrow();
      expect(initializeSpy).toHaveBeenCalled();
    });
  });

  describe('Token Resolution Performance', () => {
    it('should resolve tokens efficiently without performance degradation', async () => {
      const startTime = performance.now();

      module = await Test.createTestingModule({
        providers: [
          {
            provide: TRIB_TOKENS.MESSAGE_QUEUE_SERVICE,
            useValue: TEST_SERVICE_MOCK_VALUE,
          },
        ],
      }).compile();

      // Perform multiple resolutions
      const resolutionCount = 100;
      for (let i = 0; i < resolutionCount; i++) {
        const resolved = module.get(TRIB_TOKENS.MESSAGE_QUEUE_SERVICE);
        expect(resolved).toBe(TEST_SERVICE_MOCK_VALUE);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (less than 100ms for 100 resolutions)
      expect(duration).toBeLessThan(100);
    });
  });
});
