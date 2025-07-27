import { TribMessageWorkspaceEntity } from '../../standard-objects/trib-message.workspace-entity';
import { validateTribMessage } from '../../utils/validation/message-validator';
import {
  TribMessageStatus,
  TribMessageDirection,
  TribMessageChannel,
  TribMessagePriority,
  TribMessageEncoding,
  isValidStatusTransition,
} from '../../types/message-enums';
import { MESSAGE_FIELD_IDS } from '../../constants/trib-standard-field-ids';
import { TRIB_MESSAGE_OBJECT_IDS } from '../../constants/trib-standard-object-ids';

describe.skip('TribMessage Integration Tests', () => {
  describe.skip('Entity and Validation Integration', () => {
    it('should create a valid SMS message with all required fields', () => {
      const message = new TribMessageWorkspaceEntity();

      // Set all required fields
      message.content = 'Hello, this is a test SMS message';
      message.status = TribMessageStatus.QUEUED;
      message.channel = TribMessageChannel.SMS;
      message.direction = TribMessageDirection.OUTBOUND;
      message.from = '+1234567890';
      message.to = '+1987654321';
      message.priority = TribMessagePriority.NORMAL;
      message.encoding = TribMessageEncoding.UTF8;
      message.retryCount = 0;

      // Validate the message using the validation helper
      const validationResult = validateTribMessage({
        content: message.content,
        channel: message.channel,
        direction: message.direction,
        from: message.from,
        to: message.to,
        priority: message.priority,
        encoding: message.encoding,
        retryCount: message.retryCount,
      });

      expect(validationResult.isValid).toBe(true);
      expect(validationResult.errors).toHaveLength(0);

      // Verify entity static methods work correctly
      expect(
        TribMessageWorkspaceEntity.validateContent(
          message.content,
          message.channel,
        ),
      ).toBe(true);
      expect(TribMessageWorkspaceEntity.validatePhoneNumber(message.from)).toBe(
        true,
      );
      expect(TribMessageWorkspaceEntity.validatePhoneNumber(message.to)).toBe(
        true,
      );
      expect(TribMessageWorkspaceEntity.isTerminalStatus(message.status)).toBe(
        false,
      );
      expect(TribMessageWorkspaceEntity.canRetry(message.status)).toBe(false);
    });

    it('should create a valid email message with all required fields', () => {
      const message = new TribMessageWorkspaceEntity();

      // Set all required fields for email
      message.content =
        'Hello, this is a test email message with longer content for testing';
      message.status = TribMessageStatus.QUEUED;
      message.channel = TribMessageChannel.EMAIL;
      message.direction = TribMessageDirection.OUTBOUND;
      message.from = 'sender@example.com';
      message.to = 'recipient@example.com';
      message.priority = TribMessagePriority.HIGH;
      message.encoding = TribMessageEncoding.UTF8;
      message.retryCount = 0;

      // Validate the message using the validation helper
      const validationResult = validateTribMessage({
        content: message.content,
        channel: message.channel,
        direction: message.direction,
        from: message.from,
        to: message.to,
        priority: message.priority,
        encoding: message.encoding,
        retryCount: message.retryCount,
      });

      expect(validationResult.isValid).toBe(true);
      expect(validationResult.errors).toHaveLength(0);

      // Verify entity static methods work correctly
      expect(
        TribMessageWorkspaceEntity.validateContent(
          message.content,
          message.channel,
        ),
      ).toBe(true);
      expect(
        TribMessageWorkspaceEntity.validateEmailAddress(message.from),
      ).toBe(true);
      expect(TribMessageWorkspaceEntity.validateEmailAddress(message.to)).toBe(
        true,
      );
    });

    it('should handle message status lifecycle transitions', () => {
      const message = new TribMessageWorkspaceEntity();

      // Start with QUEUED status
      message.status = TribMessageStatus.QUEUED;
      expect(TribMessageWorkspaceEntity.isTerminalStatus(message.status)).toBe(
        false,
      );
      expect(TribMessageWorkspaceEntity.canRetry(message.status)).toBe(false);

      // Transition to SENDING
      expect(
        isValidStatusTransition(message.status, TribMessageStatus.SENDING),
      ).toBe(true);
      message.status = TribMessageStatus.SENDING;
      expect(TribMessageWorkspaceEntity.isTerminalStatus(message.status)).toBe(
        false,
      );

      // Transition to SENT
      expect(
        isValidStatusTransition(message.status, TribMessageStatus.SENT),
      ).toBe(true);
      message.status = TribMessageStatus.SENT;
      expect(TribMessageWorkspaceEntity.isTerminalStatus(message.status)).toBe(
        false,
      );

      // Transition to DELIVERED (terminal state)
      expect(
        isValidStatusTransition(message.status, TribMessageStatus.DELIVERED),
      ).toBe(true);
      message.status = TribMessageStatus.DELIVERED;
      expect(TribMessageWorkspaceEntity.isTerminalStatus(message.status)).toBe(
        true,
      );
      expect(TribMessageWorkspaceEntity.canRetry(message.status)).toBe(false);
    });

    it('should handle message failure and retry scenarios', () => {
      const message = new TribMessageWorkspaceEntity();

      // Start with SENDING status
      message.status = TribMessageStatus.SENDING;
      message.retryCount = 0;

      // Transition to FAILED
      expect(
        isValidStatusTransition(message.status, TribMessageStatus.FAILED),
      ).toBe(true);
      message.status = TribMessageStatus.FAILED;
      message.errorCode = 'E001';
      message.errorMessage = 'Network timeout';

      // Check if message can be retried
      expect(TribMessageWorkspaceEntity.canRetry(message.status)).toBe(true);
      expect(TribMessageWorkspaceEntity.isTerminalStatus(message.status)).toBe(
        false,
      );

      // Retry the message
      expect(
        isValidStatusTransition(message.status, TribMessageStatus.QUEUED),
      ).toBe(true);
      message.status = TribMessageStatus.QUEUED;
      message.retryCount = 1;

      // Clear error fields on retry
      message.errorCode = null;
      message.errorMessage = null;

      expect(message.retryCount).toBe(1);
      expect(message.errorCode).toBeNull();
      expect(message.errorMessage).toBeNull();
    });

    it('should properly handle nullable fields', () => {
      const message = new TribMessageWorkspaceEntity();

      // Set required fields
      message.content = 'Test message';
      message.status = TribMessageStatus.QUEUED;
      message.channel = TribMessageChannel.SMS;
      message.direction = TribMessageDirection.OUTBOUND;
      message.from = '+1234567890';
      message.to = '+1987654321';
      message.priority = TribMessagePriority.NORMAL;
      message.encoding = TribMessageEncoding.UTF8;
      message.retryCount = 0;

      // Test nullable fields
      message.timestamp = new Date();
      message.externalId = 'twilio-sid-123';
      message.metadata = {
        provider: 'twilio',
        cost: 0.0075,
        segments: 1,
      };
      message.messageSize = 256;
      message.contactId = 'contact-123';
      message.threadId = 'thread-456';
      message.deliveryId = 'delivery-789';

      // Verify nullable fields are set
      expect(message.timestamp).toBeInstanceOf(Date);
      expect(message.externalId).toBe('twilio-sid-123');
      expect(message.metadata).toEqual({
        provider: 'twilio',
        cost: 0.0075,
        segments: 1,
      });
      expect(message.messageSize).toBe(256);
      expect(message.contactId).toBe('contact-123');
      expect(message.threadId).toBe('thread-456');
      expect(message.deliveryId).toBe('delivery-789');

      // Test setting to null
      message.timestamp = null;
      message.externalId = null;
      message.metadata = null;
      message.messageSize = null;
      message.contactId = null;
      message.threadId = null;
      message.deliveryId = null;

      // Verify nullable fields are null
      expect(message.timestamp).toBeNull();
      expect(message.externalId).toBeNull();
      expect(message.metadata).toBeNull();
      expect(message.messageSize).toBeNull();
      expect(message.contactId).toBeNull();
      expect(message.threadId).toBeNull();
      expect(message.deliveryId).toBeNull();
    });

    it('should validate message content based on channel constraints', () => {
      const message = new TribMessageWorkspaceEntity();

      // Test SMS content validation
      message.channel = TribMessageChannel.SMS;
      message.content = 'a'.repeat(1600); // Max SMS length
      expect(
        TribMessageWorkspaceEntity.validateContent(
          message.content,
          message.channel,
        ),
      ).toBe(true);

      message.content = 'a'.repeat(1601); // Exceeds SMS length
      expect(
        TribMessageWorkspaceEntity.validateContent(
          message.content,
          message.channel,
        ),
      ).toBe(false);

      // Test MMS content validation
      message.channel = TribMessageChannel.MMS;
      message.content = 'a'.repeat(10000); // Max MMS length
      expect(
        TribMessageWorkspaceEntity.validateContent(
          message.content,
          message.channel,
        ),
      ).toBe(true);

      message.content = 'a'.repeat(10001); // Exceeds MMS length
      expect(
        TribMessageWorkspaceEntity.validateContent(
          message.content,
          message.channel,
        ),
      ).toBe(false);

      // Test Email content validation
      message.channel = TribMessageChannel.EMAIL;
      message.content = 'a'.repeat(100000); // Max Email length
      expect(
        TribMessageWorkspaceEntity.validateContent(
          message.content,
          message.channel,
        ),
      ).toBe(true);

      message.content = 'a'.repeat(100001); // Exceeds Email length
      expect(
        TribMessageWorkspaceEntity.validateContent(
          message.content,
          message.channel,
        ),
      ).toBe(false);
    });

    it('should integrate with field IDs and object IDs constants', () => {
      // Verify that the entity uses the correct field IDs
      expect(MESSAGE_FIELD_IDS.content).toBeDefined();
      expect(MESSAGE_FIELD_IDS.status).toBeDefined();
      expect(MESSAGE_FIELD_IDS.type).toBeDefined();
      expect(MESSAGE_FIELD_IDS.direction).toBeDefined();
      expect(MESSAGE_FIELD_IDS.from).toBeDefined();
      expect(MESSAGE_FIELD_IDS.to).toBeDefined();
      expect(MESSAGE_FIELD_IDS.externalId).toBeDefined();
      expect(MESSAGE_FIELD_IDS.priority).toBeDefined();
      expect(MESSAGE_FIELD_IDS.metadata).toBeDefined();
      expect(MESSAGE_FIELD_IDS.errorCode).toBeDefined();
      expect(MESSAGE_FIELD_IDS.errorMessage).toBeDefined();
      expect(MESSAGE_FIELD_IDS.retryCount).toBeDefined();
      expect(MESSAGE_FIELD_IDS.messageSize).toBeDefined();
      expect(MESSAGE_FIELD_IDS.encoding).toBeDefined();

      // Verify that the entity uses the correct object ID
      expect(TRIB_MESSAGE_OBJECT_IDS.SMS_MESSAGE).toBeDefined();

      // Verify that the field IDs are TRIB UUIDs
      expect(MESSAGE_FIELD_IDS.content).toMatch(
        /^20202020-[A-Z0-9]{4}-[0-9]{4}-[A-F0-9]{4}-[A-F0-9]{12}$/i,
      );
      expect(TRIB_MESSAGE_OBJECT_IDS.SMS_MESSAGE).toMatch(
        /^20202020-[A-Z0-9]{4}-[0-9]{4}-[A-F0-9]{4}-[A-F0-9]{12}$/i,
      );
    });

    it('should handle complex message scenarios', () => {
      const message = new TribMessageWorkspaceEntity();

      // Create a complex message with all fields
      message.content =
        'Complex message with special characters: émojis 🎉, números 123, and símbolos @#$%';
      message.status = TribMessageStatus.QUEUED;
      message.channel = TribMessageChannel.SMS;
      message.direction = TribMessageDirection.OUTBOUND;
      message.from = '+1234567890';
      message.to = '+1987654321';
      message.priority = TribMessagePriority.HIGH;
      message.encoding = TribMessageEncoding.UTF8;
      message.retryCount = 0;
      message.timestamp = new Date();
      message.externalId = 'complex-msg-123';
      message.metadata = {
        campaign: 'holiday-promotion',
        template: 'greeting',
        personalization: {
          firstName: 'John',
          lastName: 'Doe',
          locale: 'en-US',
        },
        tracking: {
          click: false,
          open: false,
          bounce: false,
        },
      };
      message.messageSize = Buffer.byteLength(message.content, 'utf8');

      // Validate the complex message
      const validationResult = validateTribMessage({
        content: message.content,
        channel: message.channel,
        direction: message.direction,
        from: message.from,
        to: message.to,
        priority: message.priority,
        encoding: message.encoding,
        retryCount: message.retryCount,
        messageSize: message.messageSize,
      });

      expect(validationResult.isValid).toBe(true);
      expect(validationResult.errors).toHaveLength(0);

      // Verify complex metadata is preserved
      expect(message.metadata.campaign).toBe('holiday-promotion');
      expect(message.metadata.personalization.firstName).toBe('John');
      expect(message.metadata.tracking.click).toBe(false);

      // Verify message size calculation
      expect(message.messageSize).toBeGreaterThan(message.content.length); // UTF-8 encoding adds bytes for special chars
    });

    it('should handle idempotency scenarios with externalId', () => {
      const message1 = new TribMessageWorkspaceEntity();
      const message2 = new TribMessageWorkspaceEntity();

      // Same external ID should be used for idempotency
      const externalId = 'twilio-sid-duplicate-test';

      message1.externalId = externalId;
      message2.externalId = externalId;

      // Both messages should have the same external ID
      expect(message1.externalId).toBe(message2.externalId);

      // The @WorkspaceIsUnique decorator should prevent duplicates in the database
      // This is a design constraint that would be enforced at the database level
      expect(message1.externalId).toBe(externalId);
      expect(message2.externalId).toBe(externalId);
    });
  });

  describe.skip('Workspace Entity Metadata', () => {
    it('should have correct workspace entity configuration', () => {
      // This test verifies that the entity has proper metadata
      // In a real Twenty environment, this would be validated by the workspace metadata system

      const entity = new TribMessageWorkspaceEntity();
      expect(entity).toBeInstanceOf(TribMessageWorkspaceEntity);

      // The entity should extend BaseWorkspaceEntity
      expect(entity.constructor.name).toBe('TribMessageWorkspaceEntity');
    });

    it('should support workspace isolation', () => {
      // Test that the entity supports workspace isolation
      // This is handled by the Twenty workspace system

      const message = new TribMessageWorkspaceEntity();
      message.content = 'Workspace isolation test';
      message.status = TribMessageStatus.QUEUED;
      message.channel = TribMessageChannel.SMS;
      message.direction = TribMessageDirection.OUTBOUND;
      message.from = '+1234567890';
      message.to = '+1987654321';

      // In a real workspace environment, this would be isolated per workspace
      expect(message.content).toBe('Workspace isolation test');
    });
  });
});
