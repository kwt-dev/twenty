import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { SmsQueueProcessor } from '../../processors/sms-queue.processor';
import { TwilioApiClientService } from '../../services/twilio-api-client.service';
import { TwilioResponseTransformerService } from '../../utils/twilio/response-transformer';
import { SendSmsJobData, SMS_QUEUE_JOBS } from '../../types/queue-job-types';
import {
  TribMessageStatus,
  TribMessageChannel,
} from '../../types/message-enums';
import { TwilioApiResult, TwilioErrorType } from '../../types/twilio-types';
import {
  CreateSmsMessageDto,
  TwilioConfigDto,
} from '../../dto/create-message.dto';
import { createMockJob } from '../helpers/test-job-factory';

describe('SmsQueueProcessor Integration Tests', () => {
  let processor: SmsQueueProcessor;
  let twilioApiClient: TwilioApiClientService;
  let twilioResponseTransformer: TwilioResponseTransformerService;

  // Test constants
  const TEST_MESSAGE_ID = 'msg-integration-test-12345';
  const TEST_WORKSPACE_ID = 'workspace-integration-test-67890';
  const TEST_PHONE_NUMBER = '+19875551000';
  const TEST_MESSAGE_TEXT = 'Integration test SMS message';
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmsQueueProcessor,
        {
          provide: TwilioApiClientService,
          useValue: {
            sendSms: jest.fn(),
          },
        },
        {
          provide: TwilioResponseTransformerService,
          useValue: {
            transformResponse: jest.fn(),
            transformError: jest.fn(),
          },
        },
      ],
    }).compile();

    processor = module.get<SmsQueueProcessor>(SmsQueueProcessor);
    twilioApiClient = module.get<TwilioApiClientService>(
      TwilioApiClientService,
    );
    twilioResponseTransformer = module.get<TwilioResponseTransformerService>(
      TwilioResponseTransformerService,
    );

    // Mock logger to avoid console output during tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete SMS Queue Processing Workflow', () => {
    it('should handle successful SMS processing end-to-end', async () => {
      // Arrange
      const mockJob = createMockJob(
        {
          messageId: TEST_MESSAGE_ID,
          twilioConfig: mockTwilioConfig,
          messageData: mockMessageData,
          workspaceId: TEST_WORKSPACE_ID,
          priority: 5,
          maxAttempts: 3,
          retryDelay: 1000,
          timeoutMs: 30000,
        },
        'integration-job-success',
      );
      mockJob.attemptsMade = 0;

      const mockSuccessResult: TwilioApiResult = {
        success: true,
        externalId: TEST_EXTERNAL_ID,
      };

      (twilioApiClient.sendSms as jest.Mock).mockResolvedValue(
        mockSuccessResult,
      );

      // Act
      await processor.handle(mockJob);

      // Assert - Verify TwilioApiClientService was called correctly
      expect(twilioApiClient.sendSms).toHaveBeenCalledWith(
        mockMessageData,
        mockTwilioConfig,
      );
      expect(twilioApiClient.sendSms).toHaveBeenCalledTimes(1);

      // Verify logging occurred
      expect(Logger.prototype.log).toHaveBeenCalledWith(
        `Processing SMS job for message ${TEST_MESSAGE_ID}`,
        expect.objectContaining({
          messageId: TEST_MESSAGE_ID,
          phoneNumber: TEST_PHONE_NUMBER,
        }),
      );

      expect(Logger.prototype.log).toHaveBeenCalledWith(
        `SMS sent successfully for message ${TEST_MESSAGE_ID}`,
        expect.objectContaining({
          messageId: TEST_MESSAGE_ID,
          externalId: TEST_EXTERNAL_ID,
          processingTime: expect.any(Number),
        }),
      );
    });

    it('should handle failed SMS processing with retry mechanism', async () => {
      // Arrange
      const mockJob = createMockJob(
        {
          messageId: TEST_MESSAGE_ID,
          twilioConfig: mockTwilioConfig,
          messageData: mockMessageData,
          workspaceId: TEST_WORKSPACE_ID,
          priority: 3,
          maxAttempts: 2,
          retryDelay: 500,
        },
        'integration-job-fail',
      );
      mockJob.attemptsMade = 1;

      const mockErrorResult: TwilioApiResult = {
        success: false,
        error: {
          type: TwilioErrorType.RATE_LIMIT,
          message: 'Rate limit exceeded',
          code: '20429',
          retryable: true,
        },
      };

      (twilioApiClient.sendSms as jest.Mock).mockResolvedValue(mockErrorResult);

      // Act & Assert
      await expect(processor.handle(mockJob)).rejects.toThrow(
        'Twilio API failed: Rate limit exceeded',
      );

      // Verify error logging
      expect(Logger.prototype.error).toHaveBeenCalledWith(
        `SMS processing failed for message ${TEST_MESSAGE_ID}`,
        expect.objectContaining({
          messageId: TEST_MESSAGE_ID,
          error: 'Twilio API failed: Rate limit exceeded',
          processingTime: expect.any(Number),
        }),
      );
    });

    it('should handle API service exceptions properly', async () => {
      // Arrange
      const mockJob = createMockJob(
        {
          messageId: TEST_MESSAGE_ID,
          twilioConfig: mockTwilioConfig,
          messageData: mockMessageData,
          workspaceId: TEST_WORKSPACE_ID,
        },
        'integration-job-exception',
      );
      mockJob.attemptsMade = 0;

      const serviceError = new Error('Network timeout - service unavailable');
      (twilioApiClient.sendSms as jest.Mock).mockRejectedValue(serviceError);

      // Act & Assert
      await expect(processor.handle(mockJob)).rejects.toThrow(
        'Network timeout - service unavailable',
      );

      // Verify service was called
      expect(twilioApiClient.sendSms).toHaveBeenCalledWith(
        mockMessageData,
        mockTwilioConfig,
      );
    });

    it('should handle job data validation failures', async () => {
      // Arrange
      const mockInvalidJob = createMockJob(
        {
          messageId: '', // Invalid - empty string
          twilioConfig: mockTwilioConfig,
          messageData: mockMessageData,
          workspaceId: TEST_WORKSPACE_ID,
        },
        'integration-job-invalid',
      );
      mockInvalidJob.attemptsMade = 0;

      // Act & Assert
      await expect(processor.handle(mockInvalidJob)).rejects.toThrow(
        'Message ID is required',
      );

      // Verify API service was NOT called due to validation failure
      expect(twilioApiClient.sendSms).not.toHaveBeenCalled();
    });

    it('should handle processing with extended job data fields', async () => {
      // Arrange
      const mockExtendedJob = createMockJob(
        {
          messageId: TEST_MESSAGE_ID,
          twilioConfig: mockTwilioConfig,
          messageData: mockMessageData,
          workspaceId: TEST_WORKSPACE_ID,
          priority: 8,
          maxAttempts: 5,
          retryDelay: 2000,
          timeoutMs: 60000,
          context: {
            source: 'integration-test',
            correlationId: 'corr-12345',
            userId: 'user-67890',
          },
        },
        'integration-job-extended',
      );
      mockExtendedJob.attemptsMade = 0;

      const mockSuccessResult: TwilioApiResult = {
        success: true,
        externalId: TEST_EXTERNAL_ID,
      };

      (twilioApiClient.sendSms as jest.Mock).mockResolvedValue(
        mockSuccessResult,
      );

      // Act
      await processor.handle(mockExtendedJob);

      // Assert - Verify extended job data doesn't break processing
      expect(twilioApiClient.sendSms).toHaveBeenCalledWith(
        mockMessageData,
        mockTwilioConfig,
      );

      expect(Logger.prototype.log).toHaveBeenCalledWith(
        `Processing SMS job for message ${TEST_MESSAGE_ID}`,
        expect.objectContaining({
          messageId: TEST_MESSAGE_ID,
          phoneNumber: TEST_PHONE_NUMBER,
        }),
      );
    });
  });

  describe('Integration with TwilioApiClientService', () => {
    it('should properly coordinate with TwilioApiClientService for successful calls', async () => {
      // Arrange
      const mockJob = createMockJob(
        {
          messageId: TEST_MESSAGE_ID,
          twilioConfig: mockTwilioConfig,
          messageData: mockMessageData,
          workspaceId: TEST_WORKSPACE_ID,
        },
        'twilio-integration-success',
      );
      mockJob.attemptsMade = 0;

      const mockResult: TwilioApiResult = {
        success: true,
        externalId: TEST_EXTERNAL_ID,
      };

      (twilioApiClient.sendSms as jest.Mock).mockResolvedValue(mockResult);

      // Act
      await processor.handle(mockJob);

      // Assert - Verify correct service integration
      expect(twilioApiClient.sendSms).toHaveBeenCalledWith(
        expect.objectContaining({
          content: TEST_MESSAGE_TEXT,
          to: TEST_PHONE_NUMBER,
          from: '+19875551234',
          workspaceId: TEST_WORKSPACE_ID,
        }),
        expect.objectContaining({
          accountSid: mockTwilioConfig.accountSid,
          authToken: mockTwilioConfig.authToken,
          phoneNumber: mockTwilioConfig.phoneNumber,
        }),
      );
    });

    it('should handle TwilioApiClientService error responses correctly', async () => {
      // Arrange
      const mockJob = createMockJob(
        {
          messageId: TEST_MESSAGE_ID,
          twilioConfig: mockTwilioConfig,
          messageData: mockMessageData,
          workspaceId: TEST_WORKSPACE_ID,
        },
        'twilio-integration-error',
      );
      mockJob.attemptsMade = 0;

      const mockErrorResult: TwilioApiResult = {
        success: false,
        error: {
          type: TwilioErrorType.AUTHENTICATION,
          message: 'Authentication failed',
          code: '20003',
          retryable: false,
        },
      };

      (twilioApiClient.sendSms as jest.Mock).mockResolvedValue(mockErrorResult);

      // Act & Assert
      await expect(processor.handle(mockJob)).rejects.toThrow(
        'Twilio API failed: Authentication failed',
      );

      // Verify service was properly called
      expect(twilioApiClient.sendSms).toHaveBeenCalledTimes(1);
    });
  });

  describe('Message Status Coordination', () => {
    it('should coordinate status updates throughout processing lifecycle', async () => {
      // Arrange
      const mockJob = createMockJob(
        {
          messageId: TEST_MESSAGE_ID,
          twilioConfig: mockTwilioConfig,
          messageData: mockMessageData,
          workspaceId: TEST_WORKSPACE_ID,
        },
        'status-coordination-test',
      );
      mockJob.attemptsMade = 0;

      const mockResult: TwilioApiResult = {
        success: true,
        externalId: TEST_EXTERNAL_ID,
      };

      (twilioApiClient.sendSms as jest.Mock).mockResolvedValue(mockResult);

      // Act
      await processor.handle(mockJob);

      // Assert - Verify status coordination logs
      expect(Logger.prototype.log).toHaveBeenCalledWith(
        `Status update: ${TEST_MESSAGE_ID} -> ${TribMessageStatus.SENDING}`,
      );

      expect(Logger.prototype.log).toHaveBeenCalledWith(
        `Success: ${TEST_MESSAGE_ID} sent with external ID ${TEST_EXTERNAL_ID}`,
      );
    });

    it('should handle status updates during error scenarios', async () => {
      // Arrange
      const mockJob = createMockJob(
        {
          messageId: TEST_MESSAGE_ID,
          twilioConfig: mockTwilioConfig,
          messageData: mockMessageData,
          workspaceId: TEST_WORKSPACE_ID,
        },
        'status-error-test',
      );
      mockJob.attemptsMade = 0;

      const serviceError = new Error('Service temporarily unavailable');
      (twilioApiClient.sendSms as jest.Mock).mockRejectedValue(serviceError);

      // Act & Assert
      await expect(processor.handle(mockJob)).rejects.toThrow(
        'Service temporarily unavailable',
      );

      // Verify error status handling
      expect(Logger.prototype.error).toHaveBeenCalledWith(
        `Error handling: ${TEST_MESSAGE_ID} failed: Service temporarily unavailable`,
      );
    });
  });
});
