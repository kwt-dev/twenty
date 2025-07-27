import { TribMessageWorkspaceEntity } from '../standard-objects/trib-message.workspace-entity';
import {
  TribMessageStatus,
  TribMessageDirection,
  TribMessageChannel,
  TribMessagePriority,
  TribMessageEncoding,
} from '../types/message-enums';

describe('TribMessageWorkspaceEntity', () => {
  describe('validateContent', () => {
    it('should return false for empty content', () => {
      expect(
        TribMessageWorkspaceEntity.validateContent('', TribMessageChannel.SMS),
      ).toBe(false);
      expect(
        TribMessageWorkspaceEntity.validateContent(
          '   ',
          TribMessageChannel.SMS,
        ),
      ).toBe(false);
    });

    it('should return false for null or undefined content', () => {
      expect(
        TribMessageWorkspaceEntity.validateContent(
          null as any,
          TribMessageChannel.SMS,
        ),
      ).toBe(false);
      expect(
        TribMessageWorkspaceEntity.validateContent(
          undefined as any,
          TribMessageChannel.SMS,
        ),
      ).toBe(false);
    });

    it('should validate SMS content length correctly', () => {
      const validSmsContent = 'Hello World';
      const invalidSmsContent = 'a'.repeat(1601); // Exceeds SMS max length

      expect(
        TribMessageWorkspaceEntity.validateContent(
          validSmsContent,
          TribMessageChannel.SMS,
        ),
      ).toBe(true);
      expect(
        TribMessageWorkspaceEntity.validateContent(
          invalidSmsContent,
          TribMessageChannel.SMS,
        ),
      ).toBe(false);
    });

    it('should validate MMS content length correctly', () => {
      const validMmsContent = 'Hello World with more content';
      const invalidMmsContent = 'a'.repeat(10001); // Exceeds MMS max length

      expect(
        TribMessageWorkspaceEntity.validateContent(
          validMmsContent,
          TribMessageChannel.MMS,
        ),
      ).toBe(true);
      expect(
        TribMessageWorkspaceEntity.validateContent(
          invalidMmsContent,
          TribMessageChannel.MMS,
        ),
      ).toBe(false);
    });

    it('should validate Email content length correctly', () => {
      const validEmailContent = 'Hello World with email content';
      const invalidEmailContent = 'a'.repeat(100001); // Exceeds Email max length

      expect(
        TribMessageWorkspaceEntity.validateContent(
          validEmailContent,
          TribMessageChannel.EMAIL,
        ),
      ).toBe(true);
      expect(
        TribMessageWorkspaceEntity.validateContent(
          invalidEmailContent,
          TribMessageChannel.EMAIL,
        ),
      ).toBe(false);
    });

    it('should validate WhatsApp content length correctly', () => {
      const validWhatsAppContent = 'Hello World via WhatsApp';
      const invalidWhatsAppContent = 'a'.repeat(4097); // Exceeds WhatsApp max length

      expect(
        TribMessageWorkspaceEntity.validateContent(
          validWhatsAppContent,
          TribMessageChannel.WHATSAPP,
        ),
      ).toBe(true);
      expect(
        TribMessageWorkspaceEntity.validateContent(
          invalidWhatsAppContent,
          TribMessageChannel.WHATSAPP,
        ),
      ).toBe(false);
    });

    it('should validate Voice content length correctly', () => {
      const validVoiceContent = 'Hello World voice script';
      const invalidVoiceContent = 'a'.repeat(1001); // Exceeds Voice max length

      expect(
        TribMessageWorkspaceEntity.validateContent(
          validVoiceContent,
          TribMessageChannel.VOICE,
        ),
      ).toBe(true);
      expect(
        TribMessageWorkspaceEntity.validateContent(
          invalidVoiceContent,
          TribMessageChannel.VOICE,
        ),
      ).toBe(false);
    });
  });

  describe('validatePhoneNumber', () => {
    it('should validate correct E.164 phone numbers', () => {
      const validPhoneNumbers = [
        '+1234567890',
        '+44123456789',
        '+33123456789',
        '+86123456789',
        '+1',
        '+999999999999999', // Max length E.164
      ];

      validPhoneNumbers.forEach((phone) => {
        expect(TribMessageWorkspaceEntity.validatePhoneNumber(phone)).toBe(
          true,
        );
      });
    });

    it('should reject invalid phone numbers', () => {
      const invalidPhoneNumbers = [
        '1234567890', // Missing +
        '+0123456789', // Starts with 0
        '++1234567890', // Double +
        '+', // Just +
        '+1234567890123456', // Too long
        '+abc', // Contains letters
        '', // Empty
        '+1-234-567-890', // Contains dashes
        '+1 234 567 890', // Contains spaces
      ];

      invalidPhoneNumbers.forEach((phone) => {
        expect(TribMessageWorkspaceEntity.validatePhoneNumber(phone)).toBe(
          false,
        );
      });
    });
  });

  describe('validateEmailAddress', () => {
    it('should validate correct email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'user_name@example-domain.com',
        'test123@test123.com',
        'a@b.co',
      ];

      validEmails.forEach((email) => {
        expect(TribMessageWorkspaceEntity.validateEmailAddress(email)).toBe(
          true,
        );
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'test@',
        'test..test@example.com',
        'test@example',
        'test@.com',
        'test @example.com', // Space
        'test@example..com', // Double dot
        '', // Empty
        'test@', // Missing domain
      ];

      invalidEmails.forEach((email) => {
        expect(TribMessageWorkspaceEntity.validateEmailAddress(email)).toBe(
          false,
        );
      });
    });
  });

  describe('isTerminalStatus', () => {
    it('should return true for terminal statuses', () => {
      expect(
        TribMessageWorkspaceEntity.isTerminalStatus(
          TribMessageStatus.DELIVERED,
        ),
      ).toBe(true);
      expect(
        TribMessageWorkspaceEntity.isTerminalStatus(TribMessageStatus.CANCELED),
      ).toBe(true);
    });

    it('should return false for non-terminal statuses', () => {
      expect(
        TribMessageWorkspaceEntity.isTerminalStatus(TribMessageStatus.QUEUED),
      ).toBe(false);
      expect(
        TribMessageWorkspaceEntity.isTerminalStatus(TribMessageStatus.SENDING),
      ).toBe(false);
      expect(
        TribMessageWorkspaceEntity.isTerminalStatus(TribMessageStatus.SENT),
      ).toBe(false);
      expect(
        TribMessageWorkspaceEntity.isTerminalStatus(TribMessageStatus.FAILED),
      ).toBe(false);
      expect(
        TribMessageWorkspaceEntity.isTerminalStatus(
          TribMessageStatus.UNDELIVERED,
        ),
      ).toBe(false);
    });
  });

  describe('canRetry', () => {
    it('should return true for retryable statuses', () => {
      expect(
        TribMessageWorkspaceEntity.canRetry(TribMessageStatus.FAILED),
      ).toBe(true);
      expect(
        TribMessageWorkspaceEntity.canRetry(TribMessageStatus.UNDELIVERED),
      ).toBe(true);
    });

    it('should return false for non-retryable statuses', () => {
      expect(
        TribMessageWorkspaceEntity.canRetry(TribMessageStatus.QUEUED),
      ).toBe(false);
      expect(
        TribMessageWorkspaceEntity.canRetry(TribMessageStatus.SENDING),
      ).toBe(false);
      expect(TribMessageWorkspaceEntity.canRetry(TribMessageStatus.SENT)).toBe(
        false,
      );
      expect(
        TribMessageWorkspaceEntity.canRetry(TribMessageStatus.DELIVERED),
      ).toBe(false);
      expect(
        TribMessageWorkspaceEntity.canRetry(TribMessageStatus.CANCELED),
      ).toBe(false);
    });
  });

  describe('entity structure', () => {
    it('should have correct default values', () => {
      const message = new TribMessageWorkspaceEntity();

      // Check that the entity can be instantiated
      expect(message).toBeInstanceOf(TribMessageWorkspaceEntity);
      expect(message).toBeDefined();
    });

    it('should support all required fields', () => {
      const message = new TribMessageWorkspaceEntity();

      // Set all required fields
      message.content = 'Test message';
      message.status = TribMessageStatus.QUEUED;
      message.channel = TribMessageChannel.SMS;
      message.direction = TribMessageDirection.OUTBOUND;
      message.from = '+1234567890';
      message.to = '+1987654321';
      message.priority = TribMessagePriority.NORMAL;
      message.encoding = TribMessageEncoding.UTF8;
      message.retryCount = 0;

      // Check that all fields are set correctly
      expect(message.content).toBe('Test message');
      expect(message.status).toBe(TribMessageStatus.QUEUED);
      expect(message.channel).toBe(TribMessageChannel.SMS);
      expect(message.direction).toBe(TribMessageDirection.OUTBOUND);
      expect(message.from).toBe('+1234567890');
      expect(message.to).toBe('+1987654321');
      expect(message.priority).toBe(TribMessagePriority.NORMAL);
      expect(message.encoding).toBe(TribMessageEncoding.UTF8);
      expect(message.retryCount).toBe(0);
    });

    it('should support all nullable fields', () => {
      const message = new TribMessageWorkspaceEntity();

      // Set nullable fields
      message.timestamp = new Date();
      message.externalId = 'ext-123';
      message.metadata = { key: 'value' };
      message.errorCode = 'E001';
      message.errorMessage = 'Test error';
      message.messageSize = 100;
      message.contactId = 'contact-123';
      message.threadId = 'thread-123';
      message.deliveryId = 'delivery-123';

      // Check that nullable fields can be set
      expect(message.timestamp).toBeInstanceOf(Date);
      expect(message.externalId).toBe('ext-123');
      expect(message.metadata).toEqual({ key: 'value' });
      expect(message.errorCode).toBe('E001');
      expect(message.errorMessage).toBe('Test error');
      expect(message.messageSize).toBe(100);
      expect(message.contactId).toBe('contact-123');
      expect(message.threadId).toBe('thread-123');
      expect(message.deliveryId).toBe('delivery-123');

      // Check that nullable fields can be null
      message.timestamp = null;
      message.externalId = null;
      message.metadata = null;
      message.errorCode = null;
      message.errorMessage = null;
      message.messageSize = null;
      message.contactId = null;
      message.threadId = null;
      message.deliveryId = null;

      expect(message.timestamp).toBeNull();
      expect(message.externalId).toBeNull();
      expect(message.metadata).toBeNull();
      expect(message.errorCode).toBeNull();
      expect(message.errorMessage).toBeNull();
      expect(message.messageSize).toBeNull();
      expect(message.contactId).toBeNull();
      expect(message.threadId).toBeNull();
      expect(message.deliveryId).toBeNull();
    });
  });
});
