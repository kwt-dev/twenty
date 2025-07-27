import { DataSource, Repository } from 'typeorm';
import { TribSmsService } from '../services/trib_sms.service';
import {
  CreateSmsMessageDto,
  TwilioConfigDto,
} from '../dto/create-message.dto';
import { TribMessageWorkspaceEntity } from '../standard-objects/trib-message.workspace-entity';
import { TribDeliveryWorkspaceEntity } from '../standard-objects/trib-delivery.workspace-entity';
import { TribConsentWorkspaceEntity } from '../standard-objects/trib-consent.workspace-entity';
import { TribThreadWorkspaceEntity } from '../standard-objects/trib-thread.workspace-entity';
import { TribPhoneNumberWorkspaceEntity } from '../standard-objects/trib-phone-number.workspace-entity';
import {
  TribMessageStatus,
  TribMessageChannel,
  TribMessageDirection,
  TribMessagePriority,
} from '../types/message-enums';
import { ConsentStatus } from '../types/consent-enums';
import { SmsQueueJobData, SMS_QUEUE_JOBS } from '../types/queue-job-types';
import * as twilioFactory from '../utils/twilio/twilio-client-factory';

// Test constants
const TEST_WORKSPACE_ID = 'ws-test-12345';
const TEST_MESSAGE_ID = 'msg-test-12345';
const TEST_PHONE_FROM = '+12345551000';
const TEST_PHONE_TO = '+19875551000';
const TEST_MESSAGE_CONTENT = 'Test SMS message for refactored service';
const TEST_ACCOUNT_SID = 'AC_test_account_sid';
const TEST_AUTH_TOKEN = 'test_auth_token';

const VALID_TWILIO_CONFIG: TwilioConfigDto = {
  accountSid: TEST_ACCOUNT_SID,
  authToken: TEST_AUTH_TOKEN,
  phoneNumber: TEST_PHONE_FROM,
  webhookUrl: 'https://test.example.com/webhook',
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
  id: 'consent-test-123',
  phoneNumber: TEST_PHONE_TO,
  status: ConsentStatus.OPTED_IN,
  optInDate: new Date('2024-01-01'),
  optOutDate: null,
  source: 'TEST',
  verificationMethod: 'DOUBLE_OPT_IN',
  legalBasis: 'CONSENT',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

/**
 * Unit tests for REFACTORED TribSmsService using direct instantiation
 *
 * This approach bypasses NestJS dependency injection to focus on testing
 * the core business logic of the refactored SMS service.
 */
describe('TribSmsService - Direct Unit Tests', () => {
  let service: TribSmsService;
  let mockDataSource: jest.Mocked<DataSource>;
  let mockMessageQueueService: any;
  let mockEntityManager: any;

  beforeEach(() => {
    // Create mock entity manager
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
      add: jest.fn().mockResolvedValue(undefined),
      addCron: jest.fn(),
      removeCron: jest.fn(),
      work: jest.fn(),
    };

    // Create mock repositories (they're not used directly in the refactored version)
    const mockRepository = {} as Repository<any>;

    // Directly instantiate the service with mocks
    service = new TribSmsService(
      mockDataSource,
      mockRepository, // tribMessageRepository
      mockRepository, // tribDeliveryRepository
      mockRepository, // tribConsentRepository
      mockRepository, // tribThreadRepository
      mockRepository, // tribPhoneNumberRepository
      mockMessageQueueService,
    );

    // Mock helper functions
    jest.spyOn(twilioFactory, 'validateTwilioConfig').mockReturnValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('Refactored sendMessage - Fast Transaction + Queue', () => {
    beforeEach(() => {
      // Setup successful transaction and queue flow
      mockEntityManager.create.mockReturnValue({ id: TEST_MESSAGE_ID });
      mockEntityManager.save.mockResolvedValue({ id: TEST_MESSAGE_ID });
      mockEntityManager.findOne.mockResolvedValue(MOCK_CONSENT_RECORD);
      mockMessageQueueService.add.mockResolvedValue(undefined);
    });

    it('should successfully queue SMS with fast transaction', async () => {
      const result = await service.sendMessage(
        VALID_SMS_MESSAGE_DTO,
        VALID_TWILIO_CONFIG,
      );

      // Verify immediate response with QUEUED status
      expect(result.success).toBe(true);
      expect(result.messageId).toBe(TEST_MESSAGE_ID);
      expect(result.status).toBe(TribMessageStatus.QUEUED);

      // Verify fast transaction was used
      expect(mockDataSource.transaction).toHaveBeenCalledTimes(1);

      // Verify message created in QUEUED status
      expect(mockEntityManager.create).toHaveBeenCalledWith(
        TribMessageWorkspaceEntity,
        expect.objectContaining({
          status: TribMessageStatus.QUEUED,
          content: TEST_MESSAGE_CONTENT,
          to: TEST_PHONE_TO,
          from: TEST_PHONE_FROM,
        }),
      );

      // Verify queue job was created
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

    it('should handle consent validation failure correctly', async () => {
      mockEntityManager.findOne.mockResolvedValue(null); // No consent

      const result = await service.sendMessage(
        VALID_SMS_MESSAGE_DTO,
        VALID_TWILIO_CONFIG,
      );

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('CONSENT_ERROR');
      expect(result.error).toContain('No valid consent found');

      // Should not attempt to queue job when transaction fails
      expect(mockMessageQueueService.add).not.toHaveBeenCalled();
    });

    it('should handle queue service errors after successful transaction', async () => {
      const queueError = new Error('Queue service unavailable');
      mockMessageQueueService.add.mockRejectedValue(queueError);

      const result = await service.sendMessage(
        VALID_SMS_MESSAGE_DTO,
        VALID_TWILIO_CONFIG,
      );

      // Transaction should have succeeded
      expect(mockDataSource.transaction).toHaveBeenCalledTimes(1);
      expect(mockEntityManager.save).toHaveBeenCalled();

      // But overall result should show queue error
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('QUEUE_ERROR');
      expect(result.error).toContain('Queue service unavailable');
      expect(result.messageId).toBe(TEST_MESSAGE_ID);
    });

    it('should use correct priority from message data', async () => {
      const highPriorityDto = {
        ...VALID_SMS_MESSAGE_DTO,
        priority: TribMessagePriority.HIGH,
      };

      await service.sendMessage(highPriorityDto, VALID_TWILIO_CONFIG);

      expect(mockMessageQueueService.add).toHaveBeenCalledWith(
        SMS_QUEUE_JOBS.SEND_SMS,
        expect.any(Object),
        expect.objectContaining({
          priority: TribMessagePriority.HIGH,
        }),
      );
    });

    it('should use default priority when not specified', async () => {
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

    it('should prevent queue job creation when transaction fails', async () => {
      const dbError = new Error('Database connection lost');
      mockDataSource.transaction.mockRejectedValue(dbError);

      await expect(
        service.sendMessage(VALID_SMS_MESSAGE_DTO, VALID_TWILIO_CONFIG),
      ).rejects.toThrow('Database connection lost');

      // Should not attempt to queue job when transaction fails
      expect(mockMessageQueueService.add).not.toHaveBeenCalled();
    });

    it('should validate Twilio configuration before processing', async () => {
      jest
        .spyOn(twilioFactory, 'validateTwilioConfig')
        .mockImplementation(() => {
          throw new Error('Invalid Twilio config');
        });

      const result = await service.sendMessage(
        VALID_SMS_MESSAGE_DTO,
        VALID_TWILIO_CONFIG,
      );

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('CONFIG_ERROR');
      expect(result.error).toContain('Invalid Twilio config');

      // Should not attempt database operations
      expect(mockDataSource.transaction).not.toHaveBeenCalled();
      expect(mockMessageQueueService.add).not.toHaveBeenCalled();
    });

    it('should validate required parameters', async () => {
      const result = await service.sendMessage(
        null as any,
        VALID_TWILIO_CONFIG,
      );

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('VALIDATION_ERROR');
      expect(result.error).toContain('Message data is required');

      // Should not attempt database operations
      expect(mockDataSource.transaction).not.toHaveBeenCalled();
      expect(mockMessageQueueService.add).not.toHaveBeenCalled();
    });

    it('should create queue job with all necessary data', async () => {
      const messageWithMetadata = {
        ...VALID_SMS_MESSAGE_DTO,
        contactId: 'contact-123',
        threadId: 'thread-456',
        metadata: { campaign: 'test-campaign', source: 'api' },
      };

      await service.sendMessage(messageWithMetadata, VALID_TWILIO_CONFIG);

      const expectedJobData: SmsQueueJobData = {
        messageId: TEST_MESSAGE_ID,
        twilioConfig: VALID_TWILIO_CONFIG,
        messageData: messageWithMetadata,
        workspaceId: TEST_WORKSPACE_ID,
        retryAttempt: 0,
      };

      expect(mockMessageQueueService.add).toHaveBeenCalledWith(
        SMS_QUEUE_JOBS.SEND_SMS,
        expectedJobData,
        expect.any(Object),
      );
    });
  });

  describe('Performance Verification', () => {
    beforeEach(() => {
      mockEntityManager.create.mockReturnValue({ id: TEST_MESSAGE_ID });
      mockEntityManager.save.mockResolvedValue({ id: TEST_MESSAGE_ID });
      mockEntityManager.findOne.mockResolvedValue(MOCK_CONSENT_RECORD);
      mockMessageQueueService.add.mockResolvedValue(undefined);
    });

    it('should complete transaction quickly in mock environment', async () => {
      const startTime = Date.now();

      const result = await service.sendMessage(
        VALID_SMS_MESSAGE_DTO,
        VALID_TWILIO_CONFIG,
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(result.success).toBe(true);
      expect(result.status).toBe(TribMessageStatus.QUEUED);

      // Verify fast completion (mock should be very fast)
      expect(duration).toBeLessThan(50); // 50ms allowance for mock overhead
    });

    it('should not call Twilio client during transaction', async () => {
      const createTwilioSpy = jest.spyOn(twilioFactory, 'createTwilioClient');

      await service.sendMessage(VALID_SMS_MESSAGE_DTO, VALID_TWILIO_CONFIG);

      // Twilio client should NOT be created during fast transaction
      expect(createTwilioSpy).not.toHaveBeenCalled();
    });
  });

  describe('Error Recovery Patterns', () => {
    it('should maintain data consistency on partial failures', async () => {
      // Transaction succeeds, queue fails
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
      expect(mockEntityManager.save).toHaveBeenCalled();
    });
  });
});

/**
 * Direct Unit Test Coverage Summary:
 *
 * ✅ Fast transaction workflow (immediate QUEUED status)
 * ✅ Queue job creation with correct data structure
 * ✅ Consent validation error handling
 * ✅ Queue service error handling after transaction
 * ✅ Priority mapping (high priority and default)
 * ✅ Transaction failure prevention of queuing
 * ✅ Twilio configuration validation
 * ✅ Parameter validation
 * ✅ Complete job data preservation (including metadata)
 * ✅ Performance verification (fast completion)
 * ✅ External API call prevention during transaction
 * ✅ Error recovery and partial failure handling
 *
 * PERFORMANCE VERIFICATION:
 * - Transaction completes in <50ms mock environment
 * - No external API calls during transaction (Twilio client not created)
 * - Immediate response with QUEUED status
 * - Queue job enables retry logic and async processing
 *
 * This test suite validates the core refactoring goals:
 * 1. Remove external API calls from database transactions
 * 2. Provide immediate response with queue-based async processing
 * 3. Maintain all validation and error handling
 * 4. Enable better scalability and performance
 */
