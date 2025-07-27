import { Test, TestingModule } from '@nestjs/testing';
import { TwilioApiClientService } from '../../services/twilio-api-client.service';
import { TwilioResponseTransformerService } from '../../utils/twilio/response-transformer';
import {
  CreateSmsMessageDto,
  TwilioConfigDto,
} from '../../dto/create-message.dto';
import { TribMessageChannel } from '../../types/message-enums';
import {
  TwilioApiResult,
  TwilioErrorType,
  TwilioOperationContext,
} from '../../types/twilio-types';
import {
  TwilioMessageResponse,
  TwilioMessageStatus,
} from '../../utils/twilio/twilio-client-factory';
import * as twilioFactory from '../../utils/twilio/twilio-client-factory';

// Test constants
const TEST_WORKSPACE_ID = 'workspace-123';
const TEST_MESSAGE_ID = 'msg-456';
const TEST_TWILIO_SID = 'SM1234567890abcdef';
const TEST_PHONE_FROM = '+1234567890';
const TEST_PHONE_TO = '+0987654321';
const TEST_MESSAGE_CONTENT = 'Test message content';
const TEST_ACCOUNT_SID = 'AC1234567890abcdef';
const TEST_AUTH_TOKEN = 'test_auth_token';

const createTestSmsMessage = (): CreateSmsMessageDto => ({
  content: TEST_MESSAGE_CONTENT,
  channel: TribMessageChannel.SMS,
  to: TEST_PHONE_TO,
  from: TEST_PHONE_FROM,
  workspaceId: TEST_WORKSPACE_ID,
});

const createTestTwilioConfig = (): TwilioConfigDto => ({
  accountSid: TEST_ACCOUNT_SID,
  authToken: TEST_AUTH_TOKEN,
  phoneNumber: TEST_PHONE_FROM,
  webhookUrl: 'https://example.com/webhook',
  timeout: 30000,
  maxRetries: 3,
});

const createMockTwilioResponse = (): TwilioMessageResponse => ({
  sid: TEST_TWILIO_SID,
  accountSid: TEST_ACCOUNT_SID,
  body: TEST_MESSAGE_CONTENT,
  from: TEST_PHONE_FROM,
  to: TEST_PHONE_TO,
  status: TwilioMessageStatus.QUEUED,
  direction: 'outbound-api',
  numSegments: '1',
  price: '-0.0075',
  priceUnit: 'USD',
  dateCreated: new Date(),
  dateUpdated: new Date(),
});

const createMockTwilioClient = () => ({
  messages: {
    create: jest.fn(),
    fetch: jest.fn(),
    list: jest.fn(),
  },
  accountSid: TEST_ACCOUNT_SID,
  authToken: TEST_AUTH_TOKEN,
});

describe('TwilioApiClientService', () => {
  let service: TwilioApiClientService;
  let transformerService: TwilioResponseTransformerService;
  let mockTwilioClient: any;

  beforeEach(async () => {
    mockTwilioClient = createMockTwilioClient();

    const module: TestingModule = await Test.createTestingModule({
      providers: [TwilioApiClientService, TwilioResponseTransformerService],
    }).compile();

    service = module.get<TwilioApiClientService>(TwilioApiClientService);
    transformerService = module.get<TwilioResponseTransformerService>(
      TwilioResponseTransformerService,
    );

    // Mock the Twilio client factory
    jest
      .spyOn(twilioFactory, 'createTwilioClient')
      .mockReturnValue(mockTwilioClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendSms', () => {
    it('should send SMS successfully with complete workflow', async () => {
      // Arrange
      const messageData = createTestSmsMessage();
      const twilioConfig = createTestTwilioConfig();
      const mockResponse = createMockTwilioResponse();

      mockTwilioClient.messages.create.mockResolvedValue(mockResponse);

      // Act
      const result = await service.sendSms(messageData, twilioConfig);

      // Assert
      expect(result.success).toBe(true);
      expect(result.externalId).toBe(TEST_TWILIO_SID);
      expect(result.status).toBe(TwilioMessageStatus.QUEUED);
      expect(result.error).toBeUndefined();

      // Verify Twilio client was created with correct config
      expect(twilioFactory.createTwilioClient).toHaveBeenCalledWith(
        twilioConfig,
      );

      // Verify message was sent with correct parameters
      expect(mockTwilioClient.messages.create).toHaveBeenCalledWith({
        body: TEST_MESSAGE_CONTENT,
        from: TEST_PHONE_FROM,
        to: TEST_PHONE_TO,
        statusCallback: twilioConfig.webhookUrl,
      });
    });

    it('should send SMS with context information for tracking', async () => {
      // Arrange
      const messageData = createTestSmsMessage();
      const twilioConfig = createTestTwilioConfig();
      const mockResponse = createMockTwilioResponse();
      const context: Partial<TwilioOperationContext> = {
        messageId: TEST_MESSAGE_ID,
        attemptNumber: 2,
        workspaceId: TEST_WORKSPACE_ID,
      };

      mockTwilioClient.messages.create.mockResolvedValue(mockResponse);

      // Act
      const result = await service.sendSms(messageData, twilioConfig, context);

      // Assert
      expect(result.success).toBe(true);
      expect(result.externalId).toBe(TEST_TWILIO_SID);
    });

    it('should use config phone number when message from is not provided', async () => {
      // Arrange
      const messageData = createTestSmsMessage();
      messageData.from = ''; // Empty from field
      const twilioConfig = createTestTwilioConfig();
      const mockResponse = createMockTwilioResponse();

      mockTwilioClient.messages.create.mockResolvedValue(mockResponse);

      // Act
      await service.sendSms(messageData, twilioConfig);

      // Assert
      expect(mockTwilioClient.messages.create).toHaveBeenCalledWith({
        body: TEST_MESSAGE_CONTENT,
        from: twilioConfig.phoneNumber,
        to: TEST_PHONE_TO,
        statusCallback: twilioConfig.webhookUrl,
      });
    });

    it('should handle authentication errors correctly', async () => {
      // Arrange
      const messageData = createTestSmsMessage();
      const twilioConfig = createTestTwilioConfig();
      const authError = {
        statusCode: 401,
        message: 'Authentication failed',
        errorCode: '20003',
      };

      mockTwilioClient.messages.create.mockRejectedValue(authError);

      // Act
      const result = await service.sendSms(messageData, twilioConfig);

      // Assert
      expect(result.success).toBe(false);
      expect(result.retryable).toBe(false);
      expect(result.error?.type).toBe(TwilioErrorType.AUTHENTICATION);
      expect(result.error?.statusCode).toBe(401);
    });

    it('should handle rate limit errors with retry information', async () => {
      // Arrange
      const messageData = createTestSmsMessage();
      const twilioConfig = createTestTwilioConfig();
      const rateLimitError = {
        statusCode: 429,
        message: 'Rate limit exceeded',
        errorCode: '20429',
        headers: { 'retry-after': '30' },
      };

      mockTwilioClient.messages.create.mockRejectedValue(rateLimitError);

      // Act
      const result = await service.sendSms(messageData, twilioConfig);

      // Assert
      expect(result.success).toBe(false);
      expect(result.retryable).toBe(true);
      expect(result.error?.type).toBe(TwilioErrorType.RATE_LIMIT);
      expect(result.error?.retryDelay).toBe(30000); // 30 seconds in milliseconds
    });

    it('should handle validation errors for invalid phone numbers', async () => {
      // Arrange
      const messageData = createTestSmsMessage();
      messageData.to = 'invalid-phone';
      const twilioConfig = createTestTwilioConfig();
      const validationError = {
        statusCode: 400,
        message: 'Invalid To phone number',
        errorCode: '21211',
      };

      mockTwilioClient.messages.create.mockRejectedValue(validationError);

      // Act
      const result = await service.sendSms(messageData, twilioConfig);

      // Assert
      expect(result.success).toBe(false);
      expect(result.retryable).toBe(false);
      expect(result.error?.type).toBe(TwilioErrorType.VALIDATION);
      expect(result.error?.message).toBe(
        'Invalid recipient phone number format',
      );
    });

    it('should handle network timeout errors', async () => {
      // Arrange
      const messageData = createTestSmsMessage();
      const twilioConfig = createTestTwilioConfig();
      twilioConfig.timeout = 1000; // 1 second timeout

      // Mock a slow response that exceeds timeout
      mockTwilioClient.messages.create.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 2000)),
      );

      // Act
      const result = await service.sendSms(messageData, twilioConfig);

      // Assert
      expect(result.success).toBe(false);
      expect(result.retryable).toBe(true);
      expect(result.error?.type).toBe(TwilioErrorType.UNKNOWN);
      expect(result.error?.message).toContain('timed out');
    });

    it('should handle Twilio client creation failure', async () => {
      // Arrange
      const messageData = createTestSmsMessage();
      const invalidConfig = createTestTwilioConfig();
      invalidConfig.accountSid = ''; // Invalid config

      jest.spyOn(twilioFactory, 'createTwilioClient').mockImplementation(() => {
        throw new Error('Invalid Account SID');
      });

      // Act
      const result = await service.sendSms(messageData, invalidConfig);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Twilio client creation failed');
    });
  });

  describe('getMessageStatus', () => {
    it('should fetch message status successfully', async () => {
      // Arrange
      const mockResponse = createMockTwilioResponse();
      mockResponse.status = TwilioMessageStatus.DELIVERED;
      mockTwilioClient.messages.fetch.mockResolvedValue(mockResponse);

      const twilioConfig = createTestTwilioConfig();

      // Act
      const result = await service.getMessageStatus(
        TEST_TWILIO_SID,
        twilioConfig,
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.externalId).toBe(TEST_TWILIO_SID);
      expect(result.status).toBe(TwilioMessageStatus.DELIVERED);
      expect(mockTwilioClient.messages.fetch).toHaveBeenCalledWith(
        TEST_TWILIO_SID,
      );
    });

    it('should handle fetch timeout correctly', async () => {
      // Arrange
      const twilioConfig = createTestTwilioConfig();
      twilioConfig.timeout = 1000; // 1 second timeout

      // Mock a slow response
      mockTwilioClient.messages.fetch.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 2000)),
      );

      // Act
      const result = await service.getMessageStatus(
        TEST_TWILIO_SID,
        twilioConfig,
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('timed out');
    });

    it('should handle message not found error', async () => {
      // Arrange
      const twilioConfig = createTestTwilioConfig();
      const notFoundError = {
        statusCode: 404,
        message: 'Message not found',
        errorCode: '20404',
      };

      mockTwilioClient.messages.fetch.mockRejectedValue(notFoundError);

      // Act
      const result = await service.getMessageStatus(
        TEST_TWILIO_SID,
        twilioConfig,
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.statusCode).toBe(404);
    });
  });

  describe('shouldRetryOperation', () => {
    it('should recommend retry for retryable errors within limit', () => {
      // Arrange
      const result: TwilioApiResult = {
        success: false,
        retryable: true,
        error: {
          type: TwilioErrorType.RATE_LIMIT,
          message: 'Rate limit exceeded',
          retryable: true,
        },
      };

      // Act & Assert
      expect(service.shouldRetryOperation(result, 1)).toBe(true);
      expect(service.shouldRetryOperation(result, 2)).toBe(true);
      expect(service.shouldRetryOperation(result, 3)).toBe(true);
      expect(service.shouldRetryOperation(result, 4)).toBe(false); // Exceeds max retries
    });

    it('should not recommend retry for non-retryable errors', () => {
      // Arrange
      const result: TwilioApiResult = {
        success: false,
        retryable: false,
        error: {
          type: TwilioErrorType.VALIDATION,
          message: 'Invalid phone number',
          retryable: false,
        },
      };

      // Act & Assert
      expect(service.shouldRetryOperation(result, 1)).toBe(false);
    });

    it('should not recommend retry for successful operations', () => {
      // Arrange
      const result: TwilioApiResult = {
        success: true,
        externalId: TEST_TWILIO_SID,
      };

      // Act & Assert
      expect(service.shouldRetryOperation(result, 1)).toBe(false);
    });
  });

  describe('calculateRetryDelay', () => {
    it('should calculate exponential backoff delay', () => {
      // Act & Assert
      const delay1 = service.calculateRetryDelay(1);
      const delay2 = service.calculateRetryDelay(2);
      const delay3 = service.calculateRetryDelay(3);

      // First attempt should be base delay (1000ms)
      expect(delay1).toBeGreaterThanOrEqual(1000);
      expect(delay1).toBeLessThan(1500); // With jitter

      // Second attempt should be roughly 2x (2000ms)
      expect(delay2).toBeGreaterThanOrEqual(2000);
      expect(delay2).toBeLessThan(3000);

      // Third attempt should be roughly 4x (4000ms)
      expect(delay3).toBeGreaterThanOrEqual(4000);
      expect(delay3).toBeLessThan(6000);
    });

    it('should use custom base delay from error result', () => {
      // Arrange
      const result: TwilioApiResult = {
        success: false,
        retryable: true,
        error: {
          type: TwilioErrorType.RATE_LIMIT,
          message: 'Rate limit exceeded',
          retryable: true,
          retryDelay: 5000, // 5 seconds
        },
      };

      // Act
      const delay = service.calculateRetryDelay(1, result);

      // Assert
      expect(delay).toBeGreaterThanOrEqual(5000);
      expect(delay).toBeLessThan(6000); // With jitter
    });

    it('should respect maximum delay limit', () => {
      // Act
      const delay = service.calculateRetryDelay(10); // Very high attempt number

      // Assert
      expect(delay).toBeLessThanOrEqual(30000); // Max delay from config
    });
  });

  describe('integration with TwilioResponseTransformerService', () => {
    it('should use transformer service for successful responses', async () => {
      // Arrange
      const messageData = createTestSmsMessage();
      const twilioConfig = createTestTwilioConfig();
      const mockResponse = createMockTwilioResponse();

      mockTwilioClient.messages.create.mockResolvedValue(mockResponse);
      const transformSpy = jest.spyOn(transformerService, 'transformSuccess');

      // Act
      await service.sendSms(messageData, twilioConfig);

      // Assert
      expect(transformSpy).toHaveBeenCalledWith(mockResponse);
    });

    it('should use transformer service for error responses', async () => {
      // Arrange
      const messageData = createTestSmsMessage();
      const twilioConfig = createTestTwilioConfig();
      const error = new Error('Test error');

      mockTwilioClient.messages.create.mockRejectedValue(error);
      const transformSpy = jest.spyOn(transformerService, 'transformError');

      // Act
      await service.sendSms(messageData, twilioConfig);

      // Assert
      expect(transformSpy).toHaveBeenCalledWith(error);
    });
  });
});
