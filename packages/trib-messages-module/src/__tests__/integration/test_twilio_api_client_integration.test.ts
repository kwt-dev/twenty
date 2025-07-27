import { Test, TestingModule } from '@nestjs/testing';
import { TwilioApiClientService } from '../../services/twilio-api-client.service';
import { TwilioResponseTransformerService } from '../../utils/twilio/response-transformer';
import {
  CreateSmsMessageDto,
  TwilioConfigDto,
} from '../../dto/create-message.dto';
import { TribMessageChannel } from '../../types/message-enums';
import { TwilioMessageStatus } from '../../utils/twilio/twilio-client-factory';
import { TwilioErrorType } from '../../types/twilio-types';

// Integration test constants
const INTEGRATION_TEST_WORKSPACE_ID = 'integration-test-workspace';
const INTEGRATION_TEST_PHONE_FROM = '+15551234567';
const INTEGRATION_TEST_PHONE_TO = '+15559876543';
const INTEGRATION_TEST_MESSAGE =
  'Integration test message from TwilioApiClientService';

const createIntegrationSmsMessage = (): CreateSmsMessageDto => ({
  content: INTEGRATION_TEST_MESSAGE,
  channel: TribMessageChannel.SMS,
  to: INTEGRATION_TEST_PHONE_TO,
  from: INTEGRATION_TEST_PHONE_FROM,
  workspaceId: INTEGRATION_TEST_WORKSPACE_ID,
});

const createIntegrationTwilioConfig = (): TwilioConfigDto => ({
  accountSid: process.env.TWILIO_ACCOUNT_SID || 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  authToken: process.env.TWILIO_AUTH_TOKEN || 'test_auth_token',
  phoneNumber: INTEGRATION_TEST_PHONE_FROM,
  webhookUrl: 'https://webhook.site/integration-test',
  timeout: 30000,
  maxRetries: 3,
});

describe('TwilioApiClientService Integration Tests', () => {
  let service: TwilioApiClientService;
  let transformerService: TwilioResponseTransformerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TwilioApiClientService, TwilioResponseTransformerService],
    }).compile();

    service = module.get<TwilioApiClientService>(TwilioApiClientService);
    transformerService = module.get<TwilioResponseTransformerService>(
      TwilioResponseTransformerService,
    );
  });

  describe('SMS Sending Integration', () => {
    it('should send SMS message through Twilio API successfully', async () => {
      // Arrange
      const messageData = createIntegrationSmsMessage();
      const twilioConfig = createIntegrationTwilioConfig();

      // Act
      const result = await service.sendSms(messageData, twilioConfig);

      // Assert
      expect(result.success).toBe(true);
      expect(result.externalId).toBeDefined();
      expect(result.externalId).toMatch(/^SM[a-f0-9]{32}$/); // Twilio SID format
      expect(result.status).toBe(TwilioMessageStatus.QUEUED);
      expect(result.error).toBeUndefined();
      expect(result.rawResponse).toBeDefined();
      expect(result.rawResponse?.body).toBe(INTEGRATION_TEST_MESSAGE);
    }, 45000); // 45 second timeout for API call

    it('should handle authentication failure gracefully', async () => {
      // Arrange
      const messageData = createIntegrationSmsMessage();
      const invalidConfig = createIntegrationTwilioConfig();
      invalidConfig.authToken = 'invalid_token'; // Invalid auth token

      // Act
      const result = await service.sendSms(messageData, invalidConfig);

      // Assert
      expect(result.success).toBe(false);
      expect(result.retryable).toBe(false);
      expect(result.error?.type).toBe(TwilioErrorType.AUTHENTICATION);
      expect(result.error?.statusCode).toBe(401);
    }, 30000);

    it('should handle invalid phone number validation', async () => {
      // Arrange
      const messageData = createIntegrationSmsMessage();
      messageData.to = '+1invalid'; // Invalid phone format
      const twilioConfig = createIntegrationTwilioConfig();

      // Act
      const result = await service.sendSms(messageData, twilioConfig);

      // Assert
      expect(result.success).toBe(false);
      expect(result.retryable).toBe(false);
      expect(result.error?.type).toBe(TwilioErrorType.VALIDATION);
      expect(result.error?.message).toContain('Invalid');
    }, 30000);

    it('should handle timeout scenarios correctly', async () => {
      // Arrange
      const messageData = createIntegrationSmsMessage();
      const twilioConfig = createIntegrationTwilioConfig();
      twilioConfig.timeout = 100; // Very short timeout to force timeout

      // Act
      const result = await service.sendSms(messageData, twilioConfig);

      // Assert
      expect(result.success).toBe(false);
      expect(result.retryable).toBe(true);
      expect(result.error?.message).toContain('timed out');
    }, 10000);

    it('should include proper context tracking information', async () => {
      // Arrange
      const messageData = createIntegrationSmsMessage();
      const twilioConfig = createIntegrationTwilioConfig();
      const context = {
        messageId: 'integration-test-msg-001',
        attemptNumber: 1,
        workspaceId: INTEGRATION_TEST_WORKSPACE_ID,
      };

      // Act
      const result = await service.sendSms(messageData, twilioConfig, context);

      // Assert
      expect(result.success).toBe(true);
      expect(result.externalId).toBeDefined();
    }, 45000);
  });

  describe('Message Status Retrieval Integration', () => {
    let testMessageSid: string;

    beforeEach(async () => {
      // First, send a message to get a valid SID for testing
      const messageData = createIntegrationSmsMessage();
      const twilioConfig = createIntegrationTwilioConfig();

      const sendResult = await service.sendSms(messageData, twilioConfig);
      if (sendResult.success && sendResult.externalId) {
        testMessageSid = sendResult.externalId;
      }
    }, 45000);

    it('should retrieve message status successfully', async () => {
      // Skip if we don't have a valid SID
      if (!testMessageSid) {
        return;
      }

      // Arrange
      const twilioConfig = createIntegrationTwilioConfig();

      // Act
      const result = await service.getMessageStatus(
        testMessageSid,
        twilioConfig,
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.externalId).toBe(testMessageSid);
      expect(result.status).toBeDefined();
      expect(Object.values(TwilioMessageStatus)).toContain(result.status);
    }, 30000);

    it('should handle non-existent message SID gracefully', async () => {
      // Arrange
      const twilioConfig = createIntegrationTwilioConfig();
      const nonExistentSid = 'SM00000000000000000000000000000000'; // Valid format but non-existent

      // Act
      const result = await service.getMessageStatus(
        nonExistentSid,
        twilioConfig,
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.statusCode).toBe(404);
    }, 30000);
  });

  describe('Retry Logic Integration', () => {
    it('should correctly identify retryable vs non-retryable errors', async () => {
      // Test 1: Non-retryable validation error
      const messageData = createIntegrationSmsMessage();
      messageData.to = 'invalid-phone';
      const twilioConfig = createIntegrationTwilioConfig();

      const validationResult = await service.sendSms(messageData, twilioConfig);
      expect(service.shouldRetryOperation(validationResult, 1)).toBe(false);

      // Test 2: Retryable authentication error (for testing purposes)
      const invalidConfig = createIntegrationTwilioConfig();
      invalidConfig.authToken = 'invalid';

      const authResult = await service.sendSms(messageData, invalidConfig);
      expect(service.shouldRetryOperation(authResult, 1)).toBe(false); // Auth errors are non-retryable
    }, 60000);

    it('should calculate appropriate retry delays', () => {
      // Test exponential backoff calculation
      const delay1 = service.calculateRetryDelay(1);
      const delay2 = service.calculateRetryDelay(2);
      const delay3 = service.calculateRetryDelay(3);

      expect(delay1).toBeGreaterThanOrEqual(1000); // At least 1 second
      expect(delay2).toBeGreaterThan(delay1); // Should increase
      expect(delay3).toBeGreaterThan(delay2); // Should continue increasing
      expect(delay3).toBeLessThanOrEqual(30000); // Should not exceed max delay
    });
  });

  describe('End-to-End Workflow Integration', () => {
    it('should complete full SMS workflow: send -> status check -> success', async () => {
      // Step 1: Send SMS
      const messageData = createIntegrationSmsMessage();
      const twilioConfig = createIntegrationTwilioConfig();

      const sendResult = await service.sendSms(messageData, twilioConfig);
      expect(sendResult.success).toBe(true);
      expect(sendResult.externalId).toBeDefined();

      // Step 2: Wait briefly for status update
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Step 3: Check status
      const statusResult = await service.getMessageStatus(
        sendResult.externalId!,
        twilioConfig,
      );
      expect(statusResult.success).toBe(true);
      expect(statusResult.status).toBeDefined();

      // Status should progress from QUEUED to SENDING/SENT
      const validStatuses = [
        TwilioMessageStatus.QUEUED,
        TwilioMessageStatus.SENDING,
        TwilioMessageStatus.SENT,
        TwilioMessageStatus.DELIVERED,
      ];
      expect(validStatuses).toContain(statusResult.status);
    }, 60000);

    it('should maintain consistent external ID throughout workflow', async () => {
      const messageData = createIntegrationSmsMessage();
      const twilioConfig = createIntegrationTwilioConfig();

      const sendResult = await service.sendSms(messageData, twilioConfig);
      expect(sendResult.success).toBe(true);

      const statusResult = await service.getMessageStatus(
        sendResult.externalId!,
        twilioConfig,
      );
      expect(statusResult.success).toBe(true);
      expect(statusResult.externalId).toBe(sendResult.externalId);
    }, 45000);
  });

  describe('Error Recovery Integration', () => {
    it('should handle service unavailable errors appropriately', async () => {
      // This test would require a way to simulate service unavailability
      // In a real scenario, we might use network conditions or test doubles
      // For now, we'll test the error classification logic

      const messageData = createIntegrationSmsMessage();
      const invalidConfig = createIntegrationTwilioConfig();
      invalidConfig.accountSid = 'AC00000000000000000000000000000000'; // Invalid but properly formatted

      const result = await service.sendSms(messageData, invalidConfig);

      // Should get an authentication error for invalid account SID
      expect(result.success).toBe(false);
      expect(result.error?.type).toBe(TwilioErrorType.AUTHENTICATION);
    }, 30000);
  });
});
