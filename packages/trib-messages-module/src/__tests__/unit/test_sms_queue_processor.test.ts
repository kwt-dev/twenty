import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { SmsQueueProcessor } from '../../processors/sms-queue.processor';
import { TwilioApiClientService } from '../../services/twilio-api-client.service';
import { SendSmsJobData, SMS_QUEUE_JOBS } from '../../types/queue-job-types';
import { createMockJob } from '../helpers/test-job-factory';
import {
  TribMessageStatus,
  TribMessageChannel,
} from '../../types/message-enums';
import { TwilioApiResult, TwilioErrorType } from '../../types/twilio-types';
import {
  CreateSmsMessageDto,
  TwilioConfigDto,
} from '../../dto/create-message.dto';

describe('SmsQueueProcessor', () => {
  let processor: SmsQueueProcessor;
  let twilioApiClient: jest.Mocked<TwilioApiClientService>;

  // Test constants
  const TEST_MESSAGE_ID = 'msg-test-12345';
  const TEST_WORKSPACE_ID = 'workspace-test-67890';
  const TEST_PHONE_NUMBER = '+19875551000';
  const TEST_MESSAGE_TEXT = 'Test SMS message';
  const TEST_EXTERNAL_ID = 'SM1234567890123456789012345678901234';

  const mockTwilioConfig: TwilioConfigDto = {
    accountSid: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    authToken: 'test-auth-token',
    phoneNumber: '+19875551234',
  };

  const mockMessageData: CreateSmsMessageDto = {
    content: TEST_MESSAGE_TEXT,
    channel: TribMessageChannel.SMS,
    to: TEST_PHONE_NUMBER,
    from: '+19875551234',
    workspaceId: TEST_WORKSPACE_ID,
  };

  const mockJobData: SendSmsJobData = {
    messageId: TEST_MESSAGE_ID,
    twilioConfig: mockTwilioConfig,
    messageData: mockMessageData,
    workspaceId: TEST_WORKSPACE_ID,
  };

  beforeEach(async () => {
    const mockTwilioApiClientService = {
      sendSms: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmsQueueProcessor,
        {
          provide: TwilioApiClientService,
          useValue: mockTwilioApiClientService,
        },
      ],
    }).compile();

    processor = module.get<SmsQueueProcessor>(SmsQueueProcessor);
    twilioApiClient = module.get(TwilioApiClientService);

    // Mock logger to avoid console output during tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handle', () => {
    it('should process SMS job successfully', async () => {
      // Arrange
      const mockSuccessResult: TwilioApiResult = {
        success: true,
        externalId: TEST_EXTERNAL_ID,
      };

      twilioApiClient.sendSms.mockResolvedValue(mockSuccessResult);

      // Act
      await processor.handle(createMockJob(mockJobData));

      // Assert
      expect(twilioApiClient.sendSms).toHaveBeenCalledWith(
        mockMessageData,
        mockTwilioConfig,
      );
      expect(twilioApiClient.sendSms).toHaveBeenCalledTimes(1);
    });

    it('should throw error when job data is invalid - missing messageId', async () => {
      // Arrange
      const invalidJobData = { ...mockJobData } as Partial<SendSmsJobData>;
      delete invalidJobData.messageId;

      // Act & Assert
      await expect(
        processor.handle(createMockJob(invalidJobData as SendSmsJobData)),
      ).rejects.toThrow('Message ID is required');
    });

    it('should throw error when job data is invalid - missing twilioConfig', async () => {
      // Arrange
      const invalidJobData = { ...mockJobData } as Partial<SendSmsJobData>;
      delete invalidJobData.twilioConfig;

      // Act & Assert
      await expect(
        processor.handle(createMockJob(invalidJobData as SendSmsJobData)),
      ).rejects.toThrow('Twilio configuration is required');
    });

    it('should throw error when job data is invalid - missing messageData', async () => {
      // Arrange
      const invalidJobData = { ...mockJobData } as Partial<SendSmsJobData>;
      delete invalidJobData.messageData;

      // Act & Assert
      await expect(
        processor.handle(createMockJob(invalidJobData as SendSmsJobData)),
      ).rejects.toThrow('Message data is required');
    });

    it('should handle Twilio API failure', async () => {
      // Arrange
      const mockErrorResult: TwilioApiResult = {
        success: false,
        error: {
          type: TwilioErrorType.VALIDATION,
          message: 'Invalid phone number',
          code: 'VALIDATION_ERROR',
          retryable: false,
        },
      };

      twilioApiClient.sendSms.mockResolvedValue(mockErrorResult);

      // Act & Assert
      await expect(
        processor.handle(createMockJob(mockJobData)),
      ).rejects.toThrow('Twilio API failed: Invalid phone number');
    });

    it('should handle Twilio API service exception', async () => {
      // Arrange
      const mockError = new Error('Network timeout');
      twilioApiClient.sendSms.mockRejectedValue(mockError);

      // Act & Assert
      await expect(
        processor.handle(createMockJob(mockJobData)),
      ).rejects.toThrow('Network timeout');
    });

    it('should log processing start and success', async () => {
      // Arrange
      const mockSuccessResult: TwilioApiResult = {
        success: true,
        externalId: TEST_EXTERNAL_ID,
      };

      twilioApiClient.sendSms.mockResolvedValue(mockSuccessResult);
      const logSpy = jest.spyOn(Logger.prototype, 'log');

      // Act
      await processor.handle(createMockJob(mockJobData));

      // Assert
      expect(logSpy).toHaveBeenCalledWith(
        `Processing SMS job for message ${TEST_MESSAGE_ID}`,
        expect.objectContaining({
          messageId: TEST_MESSAGE_ID,
          phoneNumber: TEST_PHONE_NUMBER,
        }),
      );

      expect(logSpy).toHaveBeenCalledWith(
        `SMS sent successfully for message ${TEST_MESSAGE_ID}`,
        expect.objectContaining({
          messageId: TEST_MESSAGE_ID,
          externalId: TEST_EXTERNAL_ID,
          processingTime: expect.any(Number),
        }),
      );
    });

    it('should log processing failure', async () => {
      // Arrange
      const mockError = new Error('API timeout');
      twilioApiClient.sendSms.mockRejectedValue(mockError);
      const errorSpy = jest.spyOn(Logger.prototype, 'error');

      // Act & Assert
      await expect(
        processor.handle(createMockJob(mockJobData)),
      ).rejects.toThrow('API timeout');

      expect(errorSpy).toHaveBeenCalledWith(
        `SMS processing failed for message ${TEST_MESSAGE_ID}`,
        expect.objectContaining({
          messageId: TEST_MESSAGE_ID,
          error: 'API timeout',
          processingTime: expect.any(Number),
        }),
      );
    });
  });

  describe('validateJobData', () => {
    it('should validate complete job data successfully', () => {
      // This test verifies that validation passes for complete data
      // The actual validation is tested through the handleSendSms method
      expect(() => {
        // Call private method through reflection for testing
        const validateMethod = processor['validateJobData'];
        validateMethod.call(processor, mockJobData);
      }).not.toThrow();
    });
  });

  describe('processor initialization', () => {
    it('should initialize with correct dependencies', () => {
      // Arrange & Act
      const logSpy = jest.spyOn(Logger.prototype, 'log');

      // The processor is already initialized in beforeEach
      expect(processor).toBeDefined();
      expect(twilioApiClient).toBeDefined();
    });
  });

  describe('error handling flow', () => {
    it('should handle complete error flow with proper logging', async () => {
      // Arrange
      const mockError = new Error('Service unavailable');
      twilioApiClient.sendSms.mockRejectedValue(mockError);

      const logSpy = jest.spyOn(Logger.prototype, 'log');
      const errorSpy = jest.spyOn(Logger.prototype, 'error');

      // Act & Assert
      await expect(
        processor.handle(createMockJob(mockJobData)),
      ).rejects.toThrow('Service unavailable');

      // Verify logging sequence
      expect(logSpy).toHaveBeenCalledWith(
        `Processing SMS job for message ${TEST_MESSAGE_ID}`,
        expect.objectContaining({
          messageId: TEST_MESSAGE_ID,
        }),
      );

      expect(errorSpy).toHaveBeenCalledWith(
        `SMS processing failed for message ${TEST_MESSAGE_ID}`,
        expect.objectContaining({
          messageId: TEST_MESSAGE_ID,
          error: 'Service unavailable',
        }),
      );
    });
  });
});
