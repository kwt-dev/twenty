import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SmsStatusUpdaterService } from '../../services/sms-status-updater.service';
import { TribMessageWorkspaceEntity } from '../../standard-objects/trib-message.workspace-entity';
import {
  TribDeliveryWorkspaceEntity,
  TribDeliveryStatus,
} from '../../standard-objects/trib-delivery.workspace-entity';
import { TribMessageStatus } from '../../types/message-enums';

// Test constants
const TEST_MESSAGE_ID = 'test-message-123';
const TEST_EXTERNAL_ID = 'SM1234567890abcdef';
const TEST_ERROR_CODE = '21612';
const TEST_ERROR_MESSAGE = 'The phone number is invalid';
const TEST_PROVIDER = 'TWILIO';

describe('SmsStatusUpdaterService', () => {
  let service: SmsStatusUpdaterService;
  let dataSource: DataSource;
  let messageRepository: Repository<TribMessageWorkspaceEntity>;
  let deliveryRepository: Repository<TribDeliveryWorkspaceEntity>;
  let entityManager: EntityManager;

  // Mock message entity
  const mockMessageEntity = {
    id: TEST_MESSAGE_ID,
    status: TribMessageStatus.QUEUED,
    externalId: null,
    errorCode: null,
    errorMessage: null,
    updatedAt: new Date(),
  };

  // Mock delivery entity
  const mockDeliveryEntity = {
    id: 'delivery-123',
    messageId: TEST_MESSAGE_ID,
    status: TribDeliveryStatus.QUEUED,
    externalDeliveryId: null,
    errorCode: null,
    errorMessage: null,
    timestamp: new Date(),
    provider: TEST_PROVIDER,
    attempts: 1,
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    // Create mock entity manager
    entityManager = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    } as any;

    // Create mock data source
    dataSource = {
      transaction: jest.fn(),
    } as any;

    // Create mock repositories
    messageRepository = {} as any;
    deliveryRepository = {} as any;

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

  describe('updateStatus', () => {
    it('should update message status successfully', async () => {
      // Mock transaction behavior
      (dataSource.transaction as jest.Mock).mockImplementation(
        async (callback) => {
          return await callback(entityManager);
        },
      );

      // Mock finding message entity
      (entityManager.findOne as jest.Mock).mockResolvedValueOnce({
        ...mockMessageEntity,
        status: TribMessageStatus.QUEUED,
      });

      // Mock finding delivery entity (existing)
      (entityManager.findOne as jest.Mock).mockResolvedValueOnce({
        ...mockDeliveryEntity,
        status: TribDeliveryStatus.QUEUED,
      });

      // Mock save operations
      (entityManager.save as jest.Mock).mockResolvedValue(mockMessageEntity);

      await service.updateStatus(TEST_MESSAGE_ID, TribMessageStatus.SENDING);

      expect(dataSource.transaction).toHaveBeenCalledTimes(1);
      expect(entityManager.findOne).toHaveBeenCalledWith(
        TribMessageWorkspaceEntity,
        {
          where: { id: TEST_MESSAGE_ID },
          lock: { mode: 'pessimistic_write' },
        },
      );
      expect(entityManager.save).toHaveBeenCalledWith(
        TribMessageWorkspaceEntity,
        expect.objectContaining({
          status: TribMessageStatus.SENDING,
        }),
      );
    });

    it('should skip update if status is already set (idempotent)', async () => {
      // Mock transaction behavior
      (dataSource.transaction as jest.Mock).mockImplementation(
        async (callback) => {
          return await callback(entityManager);
        },
      );

      // Mock finding message entity with same status
      (entityManager.findOne as jest.Mock).mockResolvedValueOnce({
        ...mockMessageEntity,
        status: TribMessageStatus.SENDING,
      });

      await service.updateStatus(TEST_MESSAGE_ID, TribMessageStatus.SENDING);

      expect(dataSource.transaction).toHaveBeenCalledTimes(1);
      expect(entityManager.findOne).toHaveBeenCalledTimes(1);
      expect(entityManager.save).not.toHaveBeenCalled();
    });

    it('should throw error if message not found', async () => {
      // Mock transaction behavior
      (dataSource.transaction as jest.Mock).mockImplementation(
        async (callback) => {
          return await callback(entityManager);
        },
      );

      // Mock message not found
      (entityManager.findOne as jest.Mock).mockResolvedValueOnce(null);

      await expect(
        service.updateStatus(TEST_MESSAGE_ID, TribMessageStatus.SENDING),
      ).rejects.toThrow(`Message not found: ${TEST_MESSAGE_ID}`);
    });

    it('should throw error if messageId is empty', async () => {
      await expect(
        service.updateStatus('', TribMessageStatus.SENDING),
      ).rejects.toThrow('Message ID is required');
    });

    it('should throw error if status is not provided', async () => {
      await expect(
        service.updateStatus(TEST_MESSAGE_ID, null as any),
      ).rejects.toThrow('Status is required');
    });

    it('should create new delivery record if none exists', async () => {
      // Mock transaction behavior
      (dataSource.transaction as jest.Mock).mockImplementation(
        async (callback) => {
          return await callback(entityManager);
        },
      );

      // Mock finding message entity
      (entityManager.findOne as jest.Mock).mockResolvedValueOnce({
        ...mockMessageEntity,
        status: TribMessageStatus.QUEUED,
      });

      // Mock delivery entity not found
      (entityManager.findOne as jest.Mock).mockResolvedValueOnce(null);

      // Mock create delivery entity
      (entityManager.create as jest.Mock).mockReturnValue({
        ...mockDeliveryEntity,
        status: TribDeliveryStatus.SENDING,
      });

      await service.updateStatus(TEST_MESSAGE_ID, TribMessageStatus.SENDING);

      expect(entityManager.create).toHaveBeenCalledWith(
        TribDeliveryWorkspaceEntity,
        expect.objectContaining({
          messageId: TEST_MESSAGE_ID,
          status: TribDeliveryStatus.SENDING,
          provider: TEST_PROVIDER,
          attempts: 1,
        }),
      );
    });
  });

  describe('updateWithExternalId', () => {
    it('should update message status and external ID successfully', async () => {
      // Mock transaction behavior
      (dataSource.transaction as jest.Mock).mockImplementation(
        async (callback) => {
          return await callback(entityManager);
        },
      );

      // Mock finding message entity
      (entityManager.findOne as jest.Mock).mockResolvedValueOnce({
        ...mockMessageEntity,
        status: TribMessageStatus.SENDING,
      });

      // Mock finding delivery entity (existing)
      (entityManager.findOne as jest.Mock).mockResolvedValueOnce({
        ...mockDeliveryEntity,
        status: TribDeliveryStatus.SENDING,
      });

      await service.updateWithExternalId(
        TEST_MESSAGE_ID,
        TribMessageStatus.SENT,
        TEST_EXTERNAL_ID,
      );

      expect(entityManager.save).toHaveBeenCalledWith(
        TribMessageWorkspaceEntity,
        expect.objectContaining({
          status: TribMessageStatus.SENT,
          externalId: TEST_EXTERNAL_ID,
        }),
      );
    });

    it('should skip update if status and external ID are already set', async () => {
      // Mock transaction behavior
      (dataSource.transaction as jest.Mock).mockImplementation(
        async (callback) => {
          return await callback(entityManager);
        },
      );

      // Mock finding message entity with same status and external ID
      (entityManager.findOne as jest.Mock).mockResolvedValueOnce({
        ...mockMessageEntity,
        status: TribMessageStatus.SENT,
        externalId: TEST_EXTERNAL_ID,
      });

      await service.updateWithExternalId(
        TEST_MESSAGE_ID,
        TribMessageStatus.SENT,
        TEST_EXTERNAL_ID,
      );

      expect(entityManager.save).not.toHaveBeenCalled();
    });

    it('should throw error if external ID is empty', async () => {
      await expect(
        service.updateWithExternalId(
          TEST_MESSAGE_ID,
          TribMessageStatus.SENT,
          '',
        ),
      ).rejects.toThrow('External ID is required');
    });

    it('should create new delivery record with external ID', async () => {
      // Mock transaction behavior
      (dataSource.transaction as jest.Mock).mockImplementation(
        async (callback) => {
          return await callback(entityManager);
        },
      );

      // Mock finding message entity
      (entityManager.findOne as jest.Mock).mockResolvedValueOnce({
        ...mockMessageEntity,
        status: TribMessageStatus.SENDING,
      });

      // Mock delivery entity not found
      (entityManager.findOne as jest.Mock).mockResolvedValueOnce(null);

      // Mock create delivery entity
      (entityManager.create as jest.Mock).mockReturnValue({
        ...mockDeliveryEntity,
        status: TribDeliveryStatus.SENT,
        externalDeliveryId: TEST_EXTERNAL_ID,
      });

      await service.updateWithExternalId(
        TEST_MESSAGE_ID,
        TribMessageStatus.SENT,
        TEST_EXTERNAL_ID,
      );

      expect(entityManager.create).toHaveBeenCalledWith(
        TribDeliveryWorkspaceEntity,
        expect.objectContaining({
          messageId: TEST_MESSAGE_ID,
          status: TribDeliveryStatus.SENT,
          externalDeliveryId: TEST_EXTERNAL_ID,
        }),
      );
    });
  });

  describe('updateWithError', () => {
    it('should update message status with error details successfully', async () => {
      // Mock transaction behavior
      (dataSource.transaction as jest.Mock).mockImplementation(
        async (callback) => {
          return await callback(entityManager);
        },
      );

      // Mock finding message entity
      (entityManager.findOne as jest.Mock).mockResolvedValueOnce({
        ...mockMessageEntity,
        status: TribMessageStatus.SENDING,
      });

      // Mock finding delivery entity (existing)
      (entityManager.findOne as jest.Mock).mockResolvedValueOnce({
        ...mockDeliveryEntity,
        status: TribDeliveryStatus.SENDING,
      });

      await service.updateWithError(
        TEST_MESSAGE_ID,
        TribMessageStatus.FAILED,
        TEST_ERROR_CODE,
        TEST_ERROR_MESSAGE,
      );

      expect(entityManager.save).toHaveBeenCalledWith(
        TribMessageWorkspaceEntity,
        expect.objectContaining({
          status: TribMessageStatus.FAILED,
          errorCode: TEST_ERROR_CODE,
          errorMessage: TEST_ERROR_MESSAGE,
        }),
      );
    });

    it('should skip update if status and error details are already set', async () => {
      // Mock transaction behavior
      (dataSource.transaction as jest.Mock).mockImplementation(
        async (callback) => {
          return await callback(entityManager);
        },
      );

      // Mock finding message entity with same status and error details
      (entityManager.findOne as jest.Mock).mockResolvedValueOnce({
        ...mockMessageEntity,
        status: TribMessageStatus.FAILED,
        errorCode: TEST_ERROR_CODE,
        errorMessage: TEST_ERROR_MESSAGE,
      });

      await service.updateWithError(
        TEST_MESSAGE_ID,
        TribMessageStatus.FAILED,
        TEST_ERROR_CODE,
        TEST_ERROR_MESSAGE,
      );

      expect(entityManager.save).not.toHaveBeenCalled();
    });

    it('should throw error if error code is empty', async () => {
      await expect(
        service.updateWithError(
          TEST_MESSAGE_ID,
          TribMessageStatus.FAILED,
          '',
          TEST_ERROR_MESSAGE,
        ),
      ).rejects.toThrow('Error code is required');
    });

    it('should throw error if error message is empty', async () => {
      await expect(
        service.updateWithError(
          TEST_MESSAGE_ID,
          TribMessageStatus.FAILED,
          TEST_ERROR_CODE,
          '',
        ),
      ).rejects.toThrow('Error message is required');
    });

    it('should increment attempts count on existing delivery record', async () => {
      // Mock transaction behavior
      (dataSource.transaction as jest.Mock).mockImplementation(
        async (callback) => {
          return await callback(entityManager);
        },
      );

      // Mock finding message entity
      (entityManager.findOne as jest.Mock).mockResolvedValueOnce({
        ...mockMessageEntity,
        status: TribMessageStatus.SENDING,
      });

      // Mock finding existing delivery entity
      const existingDelivery = {
        ...mockDeliveryEntity,
        attempts: 1,
      };
      (entityManager.findOne as jest.Mock).mockResolvedValueOnce(
        existingDelivery,
      );

      await service.updateWithError(
        TEST_MESSAGE_ID,
        TribMessageStatus.FAILED,
        TEST_ERROR_CODE,
        TEST_ERROR_MESSAGE,
      );

      expect(entityManager.save).toHaveBeenCalledWith(
        TribDeliveryWorkspaceEntity,
        expect.objectContaining({
          attempts: 2, // Incremented
          errorCode: TEST_ERROR_CODE,
          errorMessage: TEST_ERROR_MESSAGE,
        }),
      );
    });
  });

  describe('status mapping', () => {
    it('should map message status to delivery status correctly', async () => {
      const statusMappings: [TribMessageStatus, TribDeliveryStatus][] = [
        [TribMessageStatus.QUEUED, TribDeliveryStatus.QUEUED],
        [TribMessageStatus.SENDING, TribDeliveryStatus.SENDING],
        [TribMessageStatus.SENT, TribDeliveryStatus.SENT],
        [TribMessageStatus.DELIVERED, TribDeliveryStatus.DELIVERED],
        [TribMessageStatus.FAILED, TribDeliveryStatus.FAILED],
        [TribMessageStatus.UNDELIVERED, TribDeliveryStatus.UNDELIVERED],
        [TribMessageStatus.CANCELED, TribDeliveryStatus.CANCELED],
      ];

      for (const [messageStatus, expectedDeliveryStatus] of statusMappings) {
        // Reset mocks before each iteration
        jest.clearAllMocks();

        // Mock transaction behavior
        (dataSource.transaction as jest.Mock).mockImplementation(
          async (callback) => {
            const mockEntityManager = {
              findOne: jest.fn(),
              save: jest.fn(),
              create: jest.fn(),
            };

            // Mock finding message entity with different status to trigger update
            mockEntityManager.findOne.mockResolvedValueOnce({
              ...mockMessageEntity,
              status: TribMessageStatus.QUEUED, // Different from target status
            });

            // Mock delivery entity not found (will create new)
            mockEntityManager.findOne.mockResolvedValueOnce(null);

            // Mock create delivery entity
            mockEntityManager.create.mockReturnValue({
              ...mockDeliveryEntity,
              status: expectedDeliveryStatus,
            });

            mockEntityManager.save.mockResolvedValue({});

            const result = await callback(mockEntityManager);

            // Only verify create was called if the status would actually change
            if (messageStatus !== TribMessageStatus.QUEUED) {
              expect(mockEntityManager.create).toHaveBeenCalledWith(
                TribDeliveryWorkspaceEntity,
                expect.objectContaining({
                  status: expectedDeliveryStatus,
                }),
              );
            }

            return result;
          },
        );

        await service.updateStatus(TEST_MESSAGE_ID, messageStatus);

        expect(dataSource.transaction).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('error handling', () => {
    it('should handle transaction errors gracefully', async () => {
      const transactionError = new Error('Transaction failed');
      (dataSource.transaction as jest.Mock).mockRejectedValue(transactionError);

      await expect(
        service.updateStatus(TEST_MESSAGE_ID, TribMessageStatus.SENDING),
      ).rejects.toThrow('Transaction failed');
    });

    it('should handle entity manager errors gracefully', async () => {
      // Mock transaction behavior
      (dataSource.transaction as jest.Mock).mockImplementation(
        async (callback) => {
          return await callback(entityManager);
        },
      );

      // Mock findOne to throw error
      (entityManager.findOne as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        service.updateStatus(TEST_MESSAGE_ID, TribMessageStatus.SENDING),
      ).rejects.toThrow('Database error');
    });
  });
});
