import {
  validateMessageContent,
  validatePhoneNumber,
  validateEmailAddress,
  validateStatusTransition,
  validateMessageDirection,
  validateMessageChannel,
  validateMessagePriority,
  validateMessageEncoding,
  validateRetryCount,
  validateMessageSize,
  validateTribMessage,
  MESSAGE_VALIDATION_CONSTRAINTS,
} from '../utils/validation/message-validator';
import {
  TribMessageStatus,
  TribMessageDirection,
  TribMessageChannel,
  TribMessagePriority,
  TribMessageEncoding,
} from '../types/message-enums';

describe('Message Validation', () => {
  describe('validateMessageContent', () => {
    it('should validate empty content', () => {
      const result = validateMessageContent('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Message content cannot be empty');
    });

    it('should validate content length constraints', () => {
      const tooLongContent = 'a'.repeat(
        MESSAGE_VALIDATION_CONSTRAINTS.MAX_CONTENT_LENGTH + 1,
      );
      const result = validateMessageContent(tooLongContent);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        `Message content cannot exceed ${MESSAGE_VALIDATION_CONSTRAINTS.MAX_CONTENT_LENGTH} characters`,
      );
    });

    it('should validate SMS content length', () => {
      const validSmsContent = 'Hello World';
      const result = validateMessageContent(
        validSmsContent,
        TribMessageChannel.SMS,
      );
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject SMS content that is too long', () => {
      const tooLongSmsContent = 'a'.repeat(
        MESSAGE_VALIDATION_CONSTRAINTS.SMS_MAX_LENGTH + 1,
      );
      const result = validateMessageContent(
        tooLongSmsContent,
        TribMessageChannel.SMS,
      );
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        `SMS content cannot exceed ${MESSAGE_VALIDATION_CONSTRAINTS.SMS_MAX_LENGTH} characters`,
      );
    });

    it('should validate valid content', () => {
      const validContent = 'Hello World';
      const result = validateMessageContent(validContent);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
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
        const result = validatePhoneNumber(phone);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
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
        const result = validatePhoneNumber(phone);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    it('should handle empty phone numbers', () => {
      const result = validatePhoneNumber('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Phone number cannot be empty');
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
        const result = validateEmailAddress(email);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
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
        const result = validateEmailAddress(email);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    it('should handle empty email addresses', () => {
      const result = validateEmailAddress('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Email address cannot be empty');
    });
  });

  describe('validateStatusTransition', () => {
    it('should validate valid status transitions', () => {
      const validTransitions = [
        [TribMessageStatus.QUEUED, TribMessageStatus.SENDING],
        [TribMessageStatus.SENDING, TribMessageStatus.SENT],
        [TribMessageStatus.SENT, TribMessageStatus.DELIVERED],
        [TribMessageStatus.FAILED, TribMessageStatus.QUEUED],
      ];

      validTransitions.forEach(([currentStatus, newStatus]) => {
        const result = validateStatusTransition(currentStatus, newStatus);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should reject invalid status transitions', () => {
      const invalidTransitions = [
        [TribMessageStatus.DELIVERED, TribMessageStatus.SENDING],
        [TribMessageStatus.CANCELED, TribMessageStatus.QUEUED],
        [TribMessageStatus.QUEUED, TribMessageStatus.DELIVERED],
      ];

      invalidTransitions.forEach(([currentStatus, newStatus]) => {
        const result = validateStatusTransition(currentStatus, newStatus);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });
  });

  describe('validateMessageDirection', () => {
    it('should validate valid message directions', () => {
      const validDirections = [
        TribMessageDirection.OUTBOUND,
        TribMessageDirection.INBOUND,
      ];

      validDirections.forEach((direction) => {
        const result = validateMessageDirection(direction);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should reject invalid message directions', () => {
      const invalidDirections = [
        'invalid',
        'OUTBOUND_INVALID',
        'inbound_invalid',
        '',
        'both',
      ];

      invalidDirections.forEach((direction) => {
        const result = validateMessageDirection(direction);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });
  });

  describe('validateMessageChannel', () => {
    it('should validate valid message channels', () => {
      const validChannels = [
        TribMessageChannel.SMS,
        TribMessageChannel.MMS,
        TribMessageChannel.EMAIL,
        TribMessageChannel.WHATSAPP,
        TribMessageChannel.VOICE,
      ];

      validChannels.forEach((channel) => {
        const result = validateMessageChannel(channel);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should reject invalid message channels', () => {
      const invalidChannels = [
        'invalid',
        'SMS_INVALID',
        'telegram',
        '',
        'facebook',
      ];

      invalidChannels.forEach((channel) => {
        const result = validateMessageChannel(channel);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });
  });

  describe('validateMessagePriority', () => {
    it('should validate valid message priorities', () => {
      const validPriorities = [
        TribMessagePriority.LOW,
        TribMessagePriority.NORMAL,
        TribMessagePriority.HIGH,
        TribMessagePriority.CRITICAL,
      ];

      validPriorities.forEach((priority) => {
        const result = validateMessagePriority(priority);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should reject invalid message priorities', () => {
      const invalidPriorities = [
        'invalid',
        'URGENT',
        'medium',
        '',
        'super_high',
      ];

      invalidPriorities.forEach((priority) => {
        const result = validateMessagePriority(priority);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });
  });

  describe('validateMessageEncoding', () => {
    it('should validate valid message encodings', () => {
      const validEncodings = [
        TribMessageEncoding.UTF8,
        TribMessageEncoding.ASCII,
        TribMessageEncoding.UCS2,
        TribMessageEncoding.LATIN1,
      ];

      validEncodings.forEach((encoding) => {
        const result = validateMessageEncoding(encoding);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should reject invalid message encodings', () => {
      const invalidEncodings = [
        'invalid',
        'UTF-16',
        'iso-8859-1',
        '',
        'binary',
      ];

      invalidEncodings.forEach((encoding) => {
        const result = validateMessageEncoding(encoding);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });
  });

  describe('validateRetryCount', () => {
    it('should validate valid retry counts', () => {
      const validRetryCounts = [0, 1, 2, 3, 4, 5];

      validRetryCounts.forEach((count) => {
        const result = validateRetryCount(count);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should reject invalid retry counts', () => {
      const invalidRetryCounts = [-1, 6, 10, 100];

      invalidRetryCounts.forEach((count) => {
        const result = validateRetryCount(count);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });
  });

  describe('validateMessageSize', () => {
    it('should validate valid message sizes', () => {
      const validSizes = [0, 100, 1000, 1024 * 1024, 5 * 1024 * 1024];

      validSizes.forEach((size) => {
        const result = validateMessageSize(size);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should reject invalid message sizes', () => {
      const invalidSizes = [-1, 6 * 1024 * 1024, 10 * 1024 * 1024];

      invalidSizes.forEach((size) => {
        const result = validateMessageSize(size);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });
  });

  describe('validateTribMessage', () => {
    it('should validate a complete valid message', () => {
      const validMessage = {
        content: 'Hello World',
        channel: TribMessageChannel.SMS,
        direction: TribMessageDirection.OUTBOUND,
        from: '+1234567890',
        to: '+1987654321',
        priority: TribMessagePriority.NORMAL,
        encoding: TribMessageEncoding.UTF8,
        retryCount: 0,
        messageSize: 100,
      };

      const result = validateTribMessage(validMessage);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate SMS message with phone numbers', () => {
      const smsMessage = {
        content: 'Hello SMS',
        channel: TribMessageChannel.SMS,
        direction: TribMessageDirection.OUTBOUND,
        from: '+1234567890',
        to: '+1987654321',
      };

      const result = validateTribMessage(smsMessage);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate MMS message with phone numbers', () => {
      const mmsMessage = {
        content: 'Hello MMS',
        channel: TribMessageChannel.MMS,
        direction: TribMessageDirection.OUTBOUND,
        from: '+1234567890',
        to: '+1987654321',
      };

      const result = validateTribMessage(mmsMessage);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate email message with email addresses', () => {
      const emailMessage = {
        content: 'Hello Email',
        channel: TribMessageChannel.EMAIL,
        direction: TribMessageDirection.OUTBOUND,
        from: 'sender@example.com',
        to: 'recipient@example.com',
      };

      const result = validateTribMessage(emailMessage);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject message with invalid content', () => {
      const invalidMessage = {
        content: '',
        channel: TribMessageChannel.SMS,
        direction: TribMessageDirection.OUTBOUND,
        from: '+1234567890',
        to: '+1987654321',
      };

      const result = validateTribMessage(invalidMessage);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject message with invalid phone numbers', () => {
      const invalidMessage = {
        content: 'Hello World',
        channel: TribMessageChannel.SMS,
        direction: TribMessageDirection.OUTBOUND,
        from: 'invalid-phone',
        to: 'invalid-phone',
      };

      const result = validateTribMessage(invalidMessage);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject message with invalid email addresses', () => {
      const invalidMessage = {
        content: 'Hello World',
        channel: TribMessageChannel.EMAIL,
        direction: TribMessageDirection.OUTBOUND,
        from: 'invalid-email',
        to: 'invalid-email',
      };

      const result = validateTribMessage(invalidMessage);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject message with invalid direction', () => {
      const invalidMessage = {
        content: 'Hello World',
        channel: TribMessageChannel.SMS,
        direction: 'invalid-direction',
        from: '+1234567890',
        to: '+1987654321',
      };

      const result = validateTribMessage(invalidMessage);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject message with invalid channel', () => {
      const invalidMessage = {
        content: 'Hello World',
        channel: 'invalid-channel',
        direction: TribMessageDirection.OUTBOUND,
        from: '+1234567890',
        to: '+1987654321',
      };

      const result = validateTribMessage(invalidMessage);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate optional fields when provided', () => {
      const messageWithOptionalFields = {
        content: 'Hello World',
        channel: TribMessageChannel.SMS,
        direction: TribMessageDirection.OUTBOUND,
        from: '+1234567890',
        to: '+1987654321',
        priority: TribMessagePriority.HIGH,
        encoding: TribMessageEncoding.UTF8,
        retryCount: 2,
        messageSize: 500,
      };

      const result = validateTribMessage(messageWithOptionalFields);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject message with invalid optional fields', () => {
      const invalidMessage = {
        content: 'Hello World',
        channel: TribMessageChannel.SMS,
        direction: TribMessageDirection.OUTBOUND,
        from: '+1234567890',
        to: '+1987654321',
        priority: 'invalid-priority',
        encoding: 'invalid-encoding',
        retryCount: -1,
        messageSize: -100,
      };

      const result = validateTribMessage(invalidMessage);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
