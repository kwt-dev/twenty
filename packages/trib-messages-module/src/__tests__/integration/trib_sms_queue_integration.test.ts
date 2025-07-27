import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TribSmsService } from '../../services/trib_sms.service';
import { TRIB_TOKENS } from '../../tokens';
import {
  CreateSmsMessageDto,
  TwilioConfigDto,
} from '../../dto/create-message.dto';
import { TribMessageWorkspaceEntity } from '../../standard-objects/trib-message.workspace-entity';
import { TribDeliveryWorkspaceEntity } from '../../standard-objects/trib-delivery.workspace-entity';
import { TribConsentWorkspaceEntity } from '../../standard-objects/trib-consent.workspace-entity';
import { TribThreadWorkspaceEntity } from '../../standard-objects/trib-thread.workspace-entity';
import { TribPhoneNumberWorkspaceEntity } from '../../standard-objects/trib-phone-number.workspace-entity';
import {
  TribMessageStatus,
  TribMessageChannel,
  TribMessageDirection,
  TribMessagePriority,
} from '../../types/message-enums';
import { ConsentStatus } from '../../types/consent-enums';
import { SmsQueueJobData, SMS_QUEUE_JOBS } from '../../types/queue-job-types';
import * as twilioFactory from '../../utils/twilio/twilio-client-factory';

// Mock class for MessageQueueService - matches the interface in trib_sms.service.ts
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

// Test constants
const TEST_WORKSPACE_ID = 'ws-integration-test-workspace';
const TEST_MESSAGE_ID = 'msg-integration-test-message';
const TEST_PHONE_FROM = '+12345551000';
const TEST_PHONE_TO = '+19875551000';
const TEST_MESSAGE_CONTENT = 'Integration test message for queue processing';
const TEST_ACCOUNT_SID = 'AC_integration_test_account_sid';
const TEST_AUTH_TOKEN = 'integration_test_auth_token';

const VALID_TWILIO_CONFIG: TwilioConfigDto = {
  accountSid: TEST_ACCOUNT_SID,
  authToken: TEST_AUTH_TOKEN,
  phoneNumber: TEST_PHONE_FROM,
  webhookUrl: 'https://integration-test.example.com/webhook',
  timeout: 30000,
  maxRetries: 3,
};

const VALID_SMS_MESSAGE_DTO: CreateSmsMessageDto = {
  content: TEST_MESSAGE_CONTENT,
  channel: TribMessageChannel.SMS,
  to: TEST_PHONE_TO,
  from: TEST_PHONE_FROM,
  direction: TribMessageDirection.OUTBOUND,
  priority: TribMessagePriority.NORMAL,
  workspaceId: TEST_WORKSPACE_ID,
};

const MOCK_CONSENT_RECORD = {
  id: 'consent-integration-test',
  phoneNumber: TEST_PHONE_TO,
  status: ConsentStatus.OPTED_IN,
  optInDate: new Date('2024-01-01'),
  optOutDate: null,
  source: 'INTEGRATION_TEST',
  verificationMethod: 'DOUBLE_OPT_IN',
  legalBasis: 'CONSENT',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

/**
 * Integration tests for SMS Queue Processing
 *
 * Tests the complete workflow of:
 * 1. Creating message in database with QUEUED status
 * 2. Queueing SMS job for async processing
 * 3. Verifying queue job data structure
 * 4. Testing error scenarios and rollback behavior
 */
describe('TribSmsService Queue Integration', () => {
  let service: TribSmsService;
  let mockDataSource: jest.Mocked<DataSource>;
  let mockMessageQueueService: jest.Mocked<MockMessageQueueService>;
  let mockEntityManager: any;

  beforeEach(async () => {
    // Create mock entity manager with transaction capabilities
    mockEntityManager = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      find: jest.fn(),
      delete: jest.fn(),
    };

    // Create mock DataSource
    mockDataSource = {
      transaction: jest
        .fn()
        .mockImplementation((callback) => callback(mockEntityManager)),
    } as any;

    // Create mock MessageQueueService
    mockMessageQueueService = {
      add: jest.fn(),
      addCron: jest.fn(),
      removeCron: jest.fn(),
      work: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
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
          useValue: {} as Repository<TribMessageWorkspaceEntity>,
        },
        {
          provide: getRepositoryToken(TribDeliveryWorkspaceEntity),
          useValue: {} as Repository<TribDeliveryWorkspaceEntity>,
        },
        {
          provide: getRepositoryToken(TribConsentWorkspaceEntity),
          useValue: {} as Repository<TribConsentWorkspaceEntity>,
        },
        {
          provide: getRepositoryToken(TribThreadWorkspaceEntity),
          useValue: {} as Repository<TribThreadWorkspaceEntity>,
        },
        {
          provide: getRepositoryToken(TribPhoneNumberWorkspaceEntity),
          useValue: {} as Repository<TribPhoneNumberWorkspaceEntity>,
        },
      ],
    }).compile();

    service = module.get<TribSmsService>(TribSmsService);

    // Mock helper functions
    jest.spyOn(twilioFactory, 'validateTwilioConfig').mockReturnValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('Queue Job Creation Integration', () => {
    beforeEach(() => {
      // Setup successful transaction flow
      mockEntityManager.create.mockReturnValue({ id: TEST_MESSAGE_ID });
      mockEntityManager.save.mockResolvedValue({ id: TEST_MESSAGE_ID });
      mockEntityManager.findOne.mockResolvedValue(MOCK_CONSENT_RECORD);
      mockMessageQueueService.add.mockResolvedValue(undefined);
    });

    it('should complete full workflow: transaction + queue job creation', async () => {
      const result = await service.sendMessage(
        VALID_SMS_MESSAGE_DTO,
        VALID_TWILIO_CONFIG,
      );

      // Verify transaction completed successfully
      expect(mockDataSource.transaction).toHaveBeenCalledTimes(1);
      expect(result.success).toBe(true);
      expect(result.messageId).toBe(TEST_MESSAGE_ID);
      expect(result.status).toBe(TribMessageStatus.QUEUED);

      // Verify queue job was created with correct data
      expect(mockMessageQueueService.add).toHaveBeenCalledTimes(1);
      expect(mockMessageQueueService.add).toHaveBeenCalledWith(
        SMS_QUEUE_JOBS.SEND_SMS,
        expect.objectContaining({
          messageId: TEST_MESSAGE_ID,
          twilioConfig: VALID_TWILIO_CONFIG,
          messageData: VALID_SMS_MESSAGE_DTO,
          workspaceId: TEST_WORKSPACE_ID,
          retryAttempt: 0,
        }),
        expect.objectContaining({
          priority: TribMessagePriority.NORMAL,
          attempts: 3,
          backoff: 'exponential',
        }),
      );
    });

    it('should handle transaction rollback when consent fails', async () => {
      mockEntityManager.findOne.mockResolvedValue(null); // No consent

      const result = await service.sendMessage(
        VALID_SMS_MESSAGE_DTO,
        VALID_TWILIO_CONFIG,
      );

      // Verify transaction was called but failed due to consent
      expect(mockDataSource.transaction).toHaveBeenCalledTimes(1);
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('CONSENT_ERROR');

      // Verify queue job was NOT created when transaction fails
      expect(mockMessageQueueService.add).not.toHaveBeenCalled();
    });

    it('should handle queue service failures after successful transaction', async () => {
      const queueError = new Error('Queue service connection failed');
      mockMessageQueueService.add.mockRejectedValue(queueError);

      const result = await service.sendMessage(
        VALID_SMS_MESSAGE_DTO,
        VALID_TWILIO_CONFIG,
      );

      // Verify transaction completed successfully
      expect(mockDataSource.transaction).toHaveBeenCalledTimes(1);

      // Verify result indicates queue error
      expect(result.success).toBe(false);
      expect(result.error).toContain('Queue service connection failed');
      expect(result.errorCode).toBe('QUEUE_ERROR');
      expect(result.messageId).toBe(TEST_MESSAGE_ID);

      // Verify queue service was attempted
      expect(mockMessageQueueService.add).toHaveBeenCalledTimes(1);
    });

    it('should prevent queue job creation when transaction fails', async () => {
      const dbError = new Error('Database connection lost');
      mockDataSource.transaction.mockRejectedValue(dbError);

      await expect(
        service.sendMessage(VALID_SMS_MESSAGE_DTO, VALID_TWILIO_CONFIG),
      ).rejects.toThrow('Database connection lost');

      // Verify queue job was NOT attempted when transaction fails
      expect(mockMessageQueueService.add).not.toHaveBeenCalled();
    });

    it('should create queue job with correct priority mapping', async () => {
      const urgentMessageDto = {
        ...VALID_SMS_MESSAGE_DTO,
        priority: TribMessagePriority.CRITICAL,
      };

      await service.sendMessage(urgentMessageDto, VALID_TWILIO_CONFIG);

      expect(mockMessageQueueService.add).toHaveBeenCalledWith(
        SMS_QUEUE_JOBS.SEND_SMS,
        expect.any(Object),
        expect.objectContaining({
          priority: TribMessagePriority.CRITICAL,
          attempts: 3,
          backoff: 'exponential',
        }),
      );
    });

    it('should handle missing priority with default value', async () => {
      const noPriorityDto = { ...VALID_SMS_MESSAGE_DTO };
      delete noPriorityDto.priority;

      await service.sendMessage(noPriorityDto, VALID_TWILIO_CONFIG);

      expect(mockMessageQueueService.add).toHaveBeenCalledWith(
        SMS_QUEUE_JOBS.SEND_SMS,
        expect.any(Object),
        expect.objectContaining({
          priority: 5, // Default priority
        }),
      );
    });

    it('should preserve all message data in queue job payload', async () => {
      const messageWithMetadata = {
        ...VALID_SMS_MESSAGE_DTO,
        contactId: 'contact-123',
        threadId: 'thread-456',
        metadata: { campaign: 'integration-test', source: 'api' },
      };

      await service.sendMessage(messageWithMetadata, VALID_TWILIO_CONFIG);

      const queueJobData: SmsQueueJobData = {
        messageId: TEST_MESSAGE_ID,
        twilioConfig: VALID_TWILIO_CONFIG,
        messageData: messageWithMetadata,
        workspaceId: TEST_WORKSPACE_ID,
        retryAttempt: 0,
      };

      expect(mockMessageQueueService.add).toHaveBeenCalledWith(
        SMS_QUEUE_JOBS.SEND_SMS,
        queueJobData,
        expect.any(Object),
      );
    });
  });

  describe('Performance Integration Tests', () => {
    beforeEach(() => {
      mockEntityManager.create.mockReturnValue({ id: TEST_MESSAGE_ID });
      mockEntityManager.save.mockResolvedValue({ id: TEST_MESSAGE_ID });
      mockEntityManager.findOne.mockResolvedValue(MOCK_CONSENT_RECORD);
      mockMessageQueueService.add.mockResolvedValue(undefined);
    });

    it('should complete transaction quickly without external API calls', async () => {
      const startTime = Date.now();

      const result = await service.sendMessage(
        VALID_SMS_MESSAGE_DTO,
        VALID_TWILIO_CONFIG,
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(result.success).toBe(true);
      expect(result.status).toBe(TribMessageStatus.QUEUED);

      // Verify fast transaction (should be much faster than 50ms in mock environment)
      expect(duration).toBeLessThan(100); // Allow 100ms for test overhead
    });

    it('should not perform external API calls during transaction', async () => {
      // Create a spy that would detect external API calls
      const twilioSpy = jest.spyOn(twilioFactory, 'createTwilioClient');

      await service.sendMessage(VALID_SMS_MESSAGE_DTO, VALID_TWILIO_CONFIG);

      // Verify Twilio client was NOT created during transaction
      expect(twilioSpy).not.toHaveBeenCalled();
    });

    it('should maintain atomic transaction behavior', async () => {
      // Simulate database operations with timing verification
      let transactionStarted = false;
      let transactionCompleted = false;

      mockDataSource.transaction.mockImplementation(async (callback: any) => {
        transactionStarted = true;
        const result = await callback(mockEntityManager);
        transactionCompleted = true;
        return result;
      });

      await service.sendMessage(VALID_SMS_MESSAGE_DTO, VALID_TWILIO_CONFIG);

      expect(transactionStarted).toBe(true);
      expect(transactionCompleted).toBe(true);
      expect(mockEntityManager.create).toHaveBeenCalledTimes(1);
      expect(mockEntityManager.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Recovery Integration', () => {
    it('should handle partial failures gracefully', async () => {
      // Simulate successful transaction but failed queue operation
      mockEntityManager.create.mockReturnValue({ id: TEST_MESSAGE_ID });
      mockEntityManager.save.mockResolvedValue({ id: TEST_MESSAGE_ID });
      mockEntityManager.findOne.mockResolvedValue(MOCK_CONSENT_RECORD);

      const queueError = new Error('Queue temporarily unavailable');
      mockMessageQueueService.add.mockRejectedValue(queueError);

      const result = await service.sendMessage(
        VALID_SMS_MESSAGE_DTO,
        VALID_TWILIO_CONFIG,
      );

      // Message should be created in database despite queue failure
      expect(result.messageId).toBe(TEST_MESSAGE_ID);
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('QUEUE_ERROR');

      // This allows for manual retry or alternative processing
    });

    it('should prevent inconsistent state when transaction fails', async () => {
      mockDataSource.transaction.mockRejectedValue(
        new Error('Connection timeout'),
      );

      await expect(
        service.sendMessage(VALID_SMS_MESSAGE_DTO, VALID_TWILIO_CONFIG),
      ).rejects.toThrow('Connection timeout');

      // Verify no queue operations attempted with inconsistent state
      expect(mockMessageQueueService.add).not.toHaveBeenCalled();
    });
  });
});

/**
 * Integration Test Coverage Summary:
 *
 * ✅ Complete workflow: transaction + queue job creation
 * ✅ Transaction rollback behavior with consent failures
 * ✅ Queue service error handling after successful transaction
 * ✅ Prevention of queue jobs when transaction fails
 * ✅ Priority mapping and default value handling
 * ✅ Queue job data payload preservation
 * ✅ Performance verification (fast transactions)
 * ✅ External API call prevention during transactions
 * ✅ Atomic transaction behavior validation
 * ✅ Partial failure recovery patterns
 * ✅ Inconsistent state prevention
 *
 * Performance Verification:
 * - Verifies transactions complete quickly (<100ms mock overhead)
 * - Confirms no external API calls during transaction
 * - Validates atomic transaction behavior
 * - Tests error recovery and state consistency
 */
