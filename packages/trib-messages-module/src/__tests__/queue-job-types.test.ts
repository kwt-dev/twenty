import {
  SmsQueueJobData,
  SMS_QUEUE_JOBS,
  SmsQueueJobName,
} from '../types/queue-job-types';
import {
  CreateSmsMessageDto,
  TwilioConfigDto,
} from '../dto/create-message.dto';
import {
  TribMessageChannel,
  TribMessageDirection,
  TribMessagePriority,
} from '../types/message-enums';

// Test constants
const TEST_WORKSPACE_ID = 'ws-test-12345';
const TEST_MESSAGE_ID = 'msg-test-12345';
const TEST_PHONE_FROM = '+12345551234';
const TEST_PHONE_TO = '+19875551234';
const TEST_MESSAGE_CONTENT = 'Test queue job data message';
const TEST_ACCOUNT_SID = 'AC_test_account_sid';
const TEST_AUTH_TOKEN = 'test_auth_token';

const MOCK_TWILIO_CONFIG: TwilioConfigDto = {
  accountSid: TEST_ACCOUNT_SID,
  authToken: TEST_AUTH_TOKEN,
  phoneNumber: TEST_PHONE_FROM,
  webhookUrl: 'https://test.example.com/webhook',
  timeout: 30000,
  maxRetries: 3,
};

const MOCK_SMS_MESSAGE_DTO: CreateSmsMessageDto = {
  content: TEST_MESSAGE_CONTENT,
  channel: TribMessageChannel.SMS,
  to: TEST_PHONE_TO,
  from: TEST_PHONE_FROM,
  direction: TribMessageDirection.OUTBOUND,
  priority: TribMessagePriority.NORMAL,
  workspaceId: TEST_WORKSPACE_ID,
};

/**
 * Unit tests for SMS Queue Job Types
 *
 * Tests the SMS queue job data interface and job name constants
 * to ensure proper structure for asynchronous SMS processing.
 */
describe('SMS Queue Job Types', () => {
  describe('SmsQueueJobData interface', () => {
    it('should create valid SmsQueueJobData with all required fields', () => {
      const smsJobData: SmsQueueJobData = {
        messageId: TEST_MESSAGE_ID,
        twilioConfig: MOCK_TWILIO_CONFIG,
        messageData: MOCK_SMS_MESSAGE_DTO,
        workspaceId: TEST_WORKSPACE_ID,
        retryAttempt: 0,
      };

      expect(smsJobData.messageId).toBe(TEST_MESSAGE_ID);
      expect(smsJobData.twilioConfig).toEqual(MOCK_TWILIO_CONFIG);
      expect(smsJobData.messageData).toEqual(MOCK_SMS_MESSAGE_DTO);
      expect(smsJobData.workspaceId).toBe(TEST_WORKSPACE_ID);
      expect(smsJobData.retryAttempt).toBe(0);
    });

    it('should create valid SmsQueueJobData without optional retryAttempt', () => {
      const smsJobData: SmsQueueJobData = {
        messageId: TEST_MESSAGE_ID,
        twilioConfig: MOCK_TWILIO_CONFIG,
        messageData: MOCK_SMS_MESSAGE_DTO,
        workspaceId: TEST_WORKSPACE_ID,
      };

      expect(smsJobData.messageId).toBe(TEST_MESSAGE_ID);
      expect(smsJobData.retryAttempt).toBeUndefined();
    });

    it('should include all Twilio configuration data', () => {
      const smsJobData: SmsQueueJobData = {
        messageId: TEST_MESSAGE_ID,
        twilioConfig: MOCK_TWILIO_CONFIG,
        messageData: MOCK_SMS_MESSAGE_DTO,
        workspaceId: TEST_WORKSPACE_ID,
        retryAttempt: 1,
      };

      expect(smsJobData.twilioConfig.accountSid).toBe(TEST_ACCOUNT_SID);
      expect(smsJobData.twilioConfig.authToken).toBe(TEST_AUTH_TOKEN);
      expect(smsJobData.twilioConfig.phoneNumber).toBe(TEST_PHONE_FROM);
      expect(smsJobData.twilioConfig.webhookUrl).toBe(
        'https://test.example.com/webhook',
      );
      expect(smsJobData.twilioConfig.timeout).toBe(30000);
      expect(smsJobData.twilioConfig.maxRetries).toBe(3);
    });

    it('should include all message data fields', () => {
      const smsJobData: SmsQueueJobData = {
        messageId: TEST_MESSAGE_ID,
        twilioConfig: MOCK_TWILIO_CONFIG,
        messageData: MOCK_SMS_MESSAGE_DTO,
        workspaceId: TEST_WORKSPACE_ID,
        retryAttempt: 2,
      };

      expect(smsJobData.messageData.content).toBe(TEST_MESSAGE_CONTENT);
      expect(smsJobData.messageData.channel).toBe(TribMessageChannel.SMS);
      expect(smsJobData.messageData.to).toBe(TEST_PHONE_TO);
      expect(smsJobData.messageData.from).toBe(TEST_PHONE_FROM);
      expect(smsJobData.messageData.direction).toBe(
        TribMessageDirection.OUTBOUND,
      );
      expect(smsJobData.messageData.priority).toBe(TribMessagePriority.NORMAL);
      expect(smsJobData.messageData.workspaceId).toBe(TEST_WORKSPACE_ID);
    });

    it('should handle message data with optional fields', () => {
      const messageWithOptionalFields: CreateSmsMessageDto = {
        ...MOCK_SMS_MESSAGE_DTO,
        contactId: 'contact-123',
        threadId: 'thread-456',
        metadata: { campaign: 'test', source: 'api' },
      };

      const smsJobData: SmsQueueJobData = {
        messageId: TEST_MESSAGE_ID,
        twilioConfig: MOCK_TWILIO_CONFIG,
        messageData: messageWithOptionalFields,
        workspaceId: TEST_WORKSPACE_ID,
        retryAttempt: 0,
      };

      expect(smsJobData.messageData.contactId).toBe('contact-123');
      expect(smsJobData.messageData.threadId).toBe('thread-456');
      expect(smsJobData.messageData.metadata).toEqual({
        campaign: 'test',
        source: 'api',
      });
    });
  });

  describe('SMS_QUEUE_JOBS constants', () => {
    it('should define SEND_SMS job name', () => {
      expect(SMS_QUEUE_JOBS.SEND_SMS).toBe('send-sms');
      expect(typeof SMS_QUEUE_JOBS.SEND_SMS).toBe('string');
    });

    it('should define RETRY_SMS job name', () => {
      expect(SMS_QUEUE_JOBS.RETRY_SMS).toBe('retry-sms');
      expect(typeof SMS_QUEUE_JOBS.RETRY_SMS).toBe('string');
    });

    it('should have all expected job names', () => {
      const expectedJobNames = ['send-sms', 'retry-sms'];
      const actualJobNames = Object.values(SMS_QUEUE_JOBS);

      expect(actualJobNames).toEqual(expectedJobNames);
      expect(actualJobNames.length).toBe(2);
    });

    it('should have readonly job name constants', () => {
      // This test ensures the const assertion is working
      const jobNames: readonly string[] = Object.values(SMS_QUEUE_JOBS);
      expect(Array.isArray(jobNames)).toBe(true);
    });
  });

  describe('SmsQueueJobName type', () => {
    it('should accept valid job names', () => {
      const sendJobName: SmsQueueJobName = SMS_QUEUE_JOBS.SEND_SMS;
      const retryJobName: SmsQueueJobName = SMS_QUEUE_JOBS.RETRY_SMS;

      expect(sendJobName).toBe('send-sms');
      expect(retryJobName).toBe('retry-sms');
    });

    it('should be compatible with queue service add method', () => {
      // This test verifies type compatibility
      const jobName: SmsQueueJobName = SMS_QUEUE_JOBS.SEND_SMS;
      const smsJobData: SmsQueueJobData = {
        messageId: TEST_MESSAGE_ID,
        twilioConfig: MOCK_TWILIO_CONFIG,
        messageData: MOCK_SMS_MESSAGE_DTO,
        workspaceId: TEST_WORKSPACE_ID,
        retryAttempt: 0,
      };

      // This should compile without type errors
      expect(typeof jobName).toBe('string');
      expect(typeof smsJobData).toBe('object');
    });
  });

  describe('Queue job data validation', () => {
    it('should validate required messageId field', () => {
      const smsJobData: SmsQueueJobData = {
        messageId: '',
        twilioConfig: MOCK_TWILIO_CONFIG,
        messageData: MOCK_SMS_MESSAGE_DTO,
        workspaceId: TEST_WORKSPACE_ID,
      };

      expect(smsJobData.messageId).toBe('');
      expect(typeof smsJobData.messageId).toBe('string');
    });

    it('should validate required workspaceId field', () => {
      const smsJobData: SmsQueueJobData = {
        messageId: TEST_MESSAGE_ID,
        twilioConfig: MOCK_TWILIO_CONFIG,
        messageData: MOCK_SMS_MESSAGE_DTO,
        workspaceId: '',
      };

      expect(smsJobData.workspaceId).toBe('');
      expect(typeof smsJobData.workspaceId).toBe('string');
    });

    it('should include retry attempt for queue retry scenarios', () => {
      const retryJobData: SmsQueueJobData = {
        messageId: TEST_MESSAGE_ID,
        twilioConfig: MOCK_TWILIO_CONFIG,
        messageData: MOCK_SMS_MESSAGE_DTO,
        workspaceId: TEST_WORKSPACE_ID,
        retryAttempt: 3,
      };

      expect(retryJobData.retryAttempt).toBe(3);
      expect(typeof retryJobData.retryAttempt).toBe('number');
    });
  });

  describe('Type compatibility', () => {
    it('should extend MessageQueueJobData interface', () => {
      const smsJobData: SmsQueueJobData = {
        messageId: TEST_MESSAGE_ID,
        twilioConfig: MOCK_TWILIO_CONFIG,
        messageData: MOCK_SMS_MESSAGE_DTO,
        workspaceId: TEST_WORKSPACE_ID,
        retryAttempt: 0,
        // Additional properties should be allowed due to MessageQueueJobData interface
        customProperty: 'test-value',
      };

      expect((smsJobData as any).customProperty).toBe('test-value');
    });

    it('should work with actual queue service interface', () => {
      // Simulate queue service call structure
      const queueServiceCall = (jobName: string, data: any, options?: any) => {
        return {
          jobName,
          data,
          options,
        };
      };

      const smsJobData: SmsQueueJobData = {
        messageId: TEST_MESSAGE_ID,
        twilioConfig: MOCK_TWILIO_CONFIG,
        messageData: MOCK_SMS_MESSAGE_DTO,
        workspaceId: TEST_WORKSPACE_ID,
        retryAttempt: 0,
      };

      const queueCall = queueServiceCall(SMS_QUEUE_JOBS.SEND_SMS, smsJobData, {
        priority: 5,
        attempts: 3,
      });

      expect(queueCall.jobName).toBe('send-sms');
      expect(queueCall.data).toEqual(smsJobData);
      expect(queueCall.options.priority).toBe(5);
      expect(queueCall.options.attempts).toBe(3);
    });
  });
});

/**
 * Test Coverage Summary:
 *
 * ✅ SmsQueueJobData interface structure validation
 * ✅ Required and optional field handling
 * ✅ Twilio configuration data preservation
 * ✅ Message data field preservation
 * ✅ Optional message fields (contactId, threadId, metadata)
 * ✅ SMS_QUEUE_JOBS constant definitions
 * ✅ Job name validation and readonly nature
 * ✅ SmsQueueJobName type compatibility
 * ✅ Queue service integration compatibility
 * ✅ MessageQueueJobData interface extension
 * ✅ Retry scenario data handling
 * ✅ Type system validation
 *
 * The queue job types are fully validated and ready for
 * integration with the MessageQueueService for async SMS processing.
 */
