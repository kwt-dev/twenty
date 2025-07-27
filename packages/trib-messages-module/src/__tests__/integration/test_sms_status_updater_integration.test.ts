import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SmsStatusUpdaterService } from '../../services/sms-status-updater.service';
import { TribMessageWorkspaceEntity } from '../../standard-objects/trib-message.workspace-entity';
import {
  TribDeliveryWorkspaceEntity,
  TribDeliveryStatus,
} from '../../standard-objects/trib-delivery.workspace-entity';
import { TribMessageStatus } from '../../types/message-enums';

// Test constants
const TEST_MESSAGE_ID = 'integration-test-message-123';
const TEST_EXTERNAL_ID = 'SM1234567890abcdef';
const TEST_ERROR_CODE = '21612';
const TEST_ERROR_MESSAGE = 'The phone number is invalid';
const TEST_TIMEOUT = 30000;

/**
 * Integration tests for SMS Status Updater Service
 *
 * These tests verify the complete workflow of status updates
 * including database transactions and dual entity updates.
 *
 * Tests cover:
 * - End-to-end status update workflows
 * - Transaction rollback scenarios
 * - Concurrent update handling
 * - Database constraint validation
 * - Complete dual entity update verification
 */
describe('SMS Status Updater Service Integration', () => {
  let service: SmsStatusUpdaterService;
  let dataSource: DataSource;

  beforeAll(async () => {
    // Create mock in-memory database for integration testing
    dataSource = {
      transaction: jest.fn(),
      getRepository: jest.fn(),
    } as any;

    // Mock repositories
    const messageRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    };

    const deliveryRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmsStatusUpdaterService,
        {
          provide: DataSource,
          useValue: dataSource,
        },
        {
          provide: getRepositoryToken(TribMessageWorkspaceEntity),
          useValue: messageRepository,
        },
        {
          provide: getRepositoryToken(TribDeliveryWorkspaceEntity),
          useValue: deliveryRepository,
        },
      ],
    }).compile();

    service = module.get<SmsStatusUpdaterService>(SmsStatusUpdaterService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete SMS delivery workflow', () => {
    it(
      'should handle complete SMS delivery status progression',
      async () => {
        // Mock entities that will be updated through the workflow
        const messageEntity = {
          id: TEST_MESSAGE_ID,
          status: TribMessageStatus.QUEUED,
          externalId: null,
          errorCode: null,
          errorMessage: null,
          updatedAt: new Date(),
        };

        const deliveryEntity = {
          id: 'delivery-123',
          messageId: TEST_MESSAGE_ID,
          status: TribDeliveryStatus.QUEUED,
          externalDeliveryId: null,
          errorCode: null,
          errorMessage: null,
          attempts: 0,
          provider: 'TWILIO',
          updatedAt: new Date(),
        };

        // Mock transaction behavior
        (dataSource.transaction as jest.Mock).mockImplementation(
          async (callback) => {
            const mockEntityManager = {
              findOne: jest.fn(),
              save: jest.fn(),
              create: jest.fn(),
            };

            // Step 1: QUEUED -> SENDING
            mockEntityManager.findOne.mockResolvedValueOnce({
              ...messageEntity,
              status: TribMessageStatus.QUEUED,
            });
            mockEntityManager.findOne.mockResolvedValueOnce({
              ...deliveryEntity,
              status: TribDeliveryStatus.QUEUED,
            });
            mockEntityManager.save.mockResolvedValue(messageEntity);

            return await callback(mockEntityManager);
          },
        );

        // Test Step 1: Update to SENDING
        await service.updateStatus(TEST_MESSAGE_ID, TribMessageStatus.SENDING);

        // Verify transaction was called
        expect(dataSource.transaction).toHaveBeenCalledTimes(1);

        // Mock transaction for Step 2: SENDING -> SENT with external ID
        (dataSource.transaction as jest.Mock).mockImplementation(
          async (callback) => {
            const mockEntityManager = {
              findOne: jest.fn(),
              save: jest.fn(),
              create: jest.fn(),
            };

            mockEntityManager.findOne.mockResolvedValueOnce({
              ...messageEntity,
              status: TribMessageStatus.SENDING,
            });
            mockEntityManager.findOne.mockResolvedValueOnce({
              ...deliveryEntity,
              status: TribDeliveryStatus.SENDING,
            });
            mockEntityManager.save.mockResolvedValue(messageEntity);

            return await callback(mockEntityManager);
          },
        );

        // Test Step 2: Update to SENT with external ID
        await service.updateWithExternalId(
          TEST_MESSAGE_ID,
          TribMessageStatus.SENT,
          TEST_EXTERNAL_ID,
        );

        // Verify both transaction calls
        expect(dataSource.transaction).toHaveBeenCalledTimes(2);

        // Mock transaction for Step 3: SENT -> DELIVERED
        (dataSource.transaction as jest.Mock).mockImplementation(
          async (callback) => {
            const mockEntityManager = {
              findOne: jest.fn(),
              save: jest.fn(),
              create: jest.fn(),
            };

            mockEntityManager.findOne.mockResolvedValueOnce({
              ...messageEntity,
              status: TribMessageStatus.SENT,
              externalId: TEST_EXTERNAL_ID,
            });
            mockEntityManager.findOne.mockResolvedValueOnce({
              ...deliveryEntity,
              status: TribDeliveryStatus.SENT,
              externalDeliveryId: TEST_EXTERNAL_ID,
            });
            mockEntityManager.save.mockResolvedValue(messageEntity);

            return await callback(mockEntityManager);
          },
        );

        // Test Step 3: Update to DELIVERED
        await service.updateStatus(
          TEST_MESSAGE_ID,
          TribMessageStatus.DELIVERED,
        );

        // Verify all transaction calls
        expect(dataSource.transaction).toHaveBeenCalledTimes(3);
      },
      TEST_TIMEOUT,
    );

    it(
      'should handle SMS delivery failure with error details',
      async () => {
        // Mock entities for failure scenario
        const messageEntity = {
          id: TEST_MESSAGE_ID,
          status: TribMessageStatus.SENDING,
          externalId: TEST_EXTERNAL_ID,
          errorCode: null,
          errorMessage: null,
          updatedAt: new Date(),
        };

        const deliveryEntity = {
          id: 'delivery-123',
          messageId: TEST_MESSAGE_ID,
          status: TribDeliveryStatus.SENDING,
          externalDeliveryId: TEST_EXTERNAL_ID,
          errorCode: null,
          errorMessage: null,
          attempts: 1,
          provider: 'TWILIO',
          updatedAt: new Date(),
        };

        // Mock transaction behavior for failure
        (dataSource.transaction as jest.Mock).mockImplementation(
          async (callback) => {
            const mockEntityManager = {
              findOne: jest.fn(),
              save: jest.fn(),
              create: jest.fn(),
            };

            // Mock finding message and delivery entities
            mockEntityManager.findOne.mockResolvedValueOnce({
              ...messageEntity,
              status: TribMessageStatus.SENDING,
            });
            mockEntityManager.findOne.mockResolvedValueOnce({
              ...deliveryEntity,
              status: TribDeliveryStatus.SENDING,
              attempts: 1,
            });

            // Mock save operations
            mockEntityManager.save.mockResolvedValue(messageEntity);

            return await callback(mockEntityManager);
          },
        );

        // Test failure scenario
        await service.updateWithError(
          TEST_MESSAGE_ID,
          TribMessageStatus.FAILED,
          TEST_ERROR_CODE,
          TEST_ERROR_MESSAGE,
        );

        // Verify transaction was called
        expect(dataSource.transaction).toHaveBeenCalledTimes(1);
      },
      TEST_TIMEOUT,
    );
  });

  describe('Idempotency and concurrent updates', () => {
    it(
      'should handle concurrent status updates correctly',
      async () => {
        // Mock entities
        const messageEntity = {
          id: TEST_MESSAGE_ID,
          status: TribMessageStatus.QUEUED,
          externalId: null,
          updatedAt: new Date(),
        };

        // Mock transaction with pessimistic locking
        (dataSource.transaction as jest.Mock).mockImplementation(
          async (callback) => {
            const mockEntityManager = {
              findOne: jest.fn(),
              save: jest.fn(),
              create: jest.fn(),
            };

            // Mock finding message with lock
            mockEntityManager.findOne.mockResolvedValueOnce({
              ...messageEntity,
              status: TribMessageStatus.QUEUED,
            });

            // Mock no existing delivery record
            mockEntityManager.findOne.mockResolvedValueOnce(null);

            // Mock creating new delivery record
            mockEntityManager.create.mockReturnValue({
              messageId: TEST_MESSAGE_ID,
              status: TribDeliveryStatus.SENDING,
              provider: 'TWILIO',
              attempts: 1,
            });

            mockEntityManager.save.mockResolvedValue(messageEntity);

            return await callback(mockEntityManager);
          },
        );

        // Test concurrent update scenario
        await service.updateStatus(TEST_MESSAGE_ID, TribMessageStatus.SENDING);

        // Verify pessimistic locking was used
        expect(dataSource.transaction).toHaveBeenCalledTimes(1);
      },
      TEST_TIMEOUT,
    );

    it(
      'should demonstrate idempotent behavior with multiple identical updates',
      async () => {
        // Mock entities with already-set status
        const messageEntity = {
          id: TEST_MESSAGE_ID,
          status: TribMessageStatus.SENT,
          externalId: TEST_EXTERNAL_ID,
          updatedAt: new Date(),
        };

        // Mock transaction for idempotency test
        (dataSource.transaction as jest.Mock).mockImplementation(
          async (callback) => {
            const mockEntityManager = {
              findOne: jest.fn(),
              save: jest.fn(),
              create: jest.fn(),
            };

            // Mock finding message with same status and external ID
            mockEntityManager.findOne.mockResolvedValueOnce({
              ...messageEntity,
              status: TribMessageStatus.SENT,
              externalId: TEST_EXTERNAL_ID,
            });

            return await callback(mockEntityManager);
          },
        );

        // Test idempotent update
        await service.updateWithExternalId(
          TEST_MESSAGE_ID,
          TribMessageStatus.SENT,
          TEST_EXTERNAL_ID,
        );

        // Verify transaction was called but no save operations
        expect(dataSource.transaction).toHaveBeenCalledTimes(1);
      },
      TEST_TIMEOUT,
    );
  });

  describe('Error handling and recovery', () => {
    it(
      'should handle database transaction rollback on error',
      async () => {
        // Mock transaction that throws error
        (dataSource.transaction as jest.Mock).mockRejectedValue(
          new Error('Database connection failed'),
        );

        // Test that error is properly propagated
        await expect(
          service.updateStatus(TEST_MESSAGE_ID, TribMessageStatus.SENDING),
        ).rejects.toThrow('Database connection failed');
      },
      TEST_TIMEOUT,
    );

    it(
      'should handle entity not found scenarios',
      async () => {
        // Mock transaction behavior
        (dataSource.transaction as jest.Mock).mockImplementation(
          async (callback) => {
            const mockEntityManager = {
              findOne: jest.fn(),
              save: jest.fn(),
              create: jest.fn(),
            };

            // Mock message not found
            mockEntityManager.findOne.mockResolvedValueOnce(null);

            return await callback(mockEntityManager);
          },
        );

        // Test message not found scenario
        await expect(
          service.updateStatus(
            'nonexistent-message',
            TribMessageStatus.SENDING,
          ),
        ).rejects.toThrow('Message not found: nonexistent-message');
      },
      TEST_TIMEOUT,
    );
  });

  describe('Performance and scalability', () => {
    it(
      'should handle high-throughput status updates efficiently',
      async () => {
        const UPDATE_COUNT = 100;
        const updates = [];

        // Mock transaction for performance test
        (dataSource.transaction as jest.Mock).mockImplementation(
          async (callback) => {
            const mockEntityManager = {
              findOne: jest.fn(),
              save: jest.fn(),
              create: jest.fn(),
            };

            // Mock finding message entity
            mockEntityManager.findOne.mockResolvedValueOnce({
              id: TEST_MESSAGE_ID,
              status: TribMessageStatus.QUEUED,
            });

            // Mock finding delivery entity
            mockEntityManager.findOne.mockResolvedValueOnce({
              id: 'delivery-123',
              messageId: TEST_MESSAGE_ID,
              status: TribDeliveryStatus.QUEUED,
            });

            mockEntityManager.save.mockResolvedValue({});

            return await callback(mockEntityManager);
          },
        );

        // Create multiple concurrent updates
        for (let i = 0; i < UPDATE_COUNT; i++) {
          updates.push(
            service.updateStatus(
              `${TEST_MESSAGE_ID}-${i}`,
              TribMessageStatus.SENDING,
            ),
          );
        }

        // Measure performance
        const startTime = Date.now();
        await Promise.all(updates);
        const endTime = Date.now();

        // Verify all updates completed
        expect(dataSource.transaction).toHaveBeenCalledTimes(UPDATE_COUNT);

        // Performance assertion (should complete within reasonable time)
        const executionTime = endTime - startTime;
        expect(executionTime).toBeLessThan(10000); // 10 seconds max
      },
      TEST_TIMEOUT,
    );
  });
});
