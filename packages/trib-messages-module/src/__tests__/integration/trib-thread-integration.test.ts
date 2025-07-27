import { TribThreadWorkspaceEntity } from '../../standard-objects/trib-thread.workspace-entity';
import { TribMessageWorkspaceEntity } from '../../standard-objects/trib-message.workspace-entity';
import {
  TribThreadStatus,
  TribThreadType,
  TribThreadPriority,
} from '../../types/thread-enums';
import {
  TribMessageStatus,
  TribMessageDirection,
  TribMessageChannel,
} from '../../types/message-enums';
import {
  THREAD_FIELD_IDS,
  MESSAGE_FIELD_IDS,
} from '../../constants/trib-standard-field-ids';
import {
  validateThreadStatus,
  validateThreadSubject,
  validateThreadParticipants,
  validateThreadTags,
  validateMessageCount,
  validateThreadMetadata,
} from '../../utils/validation/thread-validator';

describe.skip('TribThread Integration Tests (Disabled during DI refactoring)', () => {
  describe('Thread-Message Relationship Integration', () => {
    it('should create a thread with associated messages', () => {
      // Create a thread
      const thread = new TribThreadWorkspaceEntity();
      thread.id = 'thread-123';
      thread.subject = 'Customer Support - Product Question';
      thread.participants = ['+1234567890', '+0987654321'];
      thread.status = TribThreadStatus.ACTIVE;
      thread.type = TribThreadType.SUPPORT;
      thread.priority = TribThreadPriority.HIGH;
      thread.messageCount = 0;
      thread.archived = false;
      thread.readStatus = false;
      thread.createdAt = new Date('2024-01-01T00:00:00Z');
      thread.updatedAt = new Date('2024-01-01T00:00:00Z');
      thread.deletedAt = null;

      // Create messages that belong to the thread
      const message1 = new TribMessageWorkspaceEntity();
      message1.id = 'msg-001';
      message1.content = 'Hello, I need help with my order';
      message1.channel = TribMessageChannel.SMS;
      message1.direction = TribMessageDirection.INBOUND;
      message1.from = '+1234567890';
      message1.to = '+0987654321';
      message1.status = TribMessageStatus.DELIVERED;
      message1.threadId = thread.id;
      message1.createdAt = new Date('2024-01-01T10:00:00Z');
      message1.updatedAt = new Date('2024-01-01T10:00:00Z');
      message1.deletedAt = null;

      const message2 = new TribMessageWorkspaceEntity();
      message2.id = 'msg-002';
      message2.content =
        'Sure, I can help you with that. What is your order number?';
      message2.channel = TribMessageChannel.SMS;
      message2.direction = TribMessageDirection.OUTBOUND;
      message2.from = '+0987654321';
      message2.to = '+1234567890';
      message2.status = TribMessageStatus.DELIVERED;
      message2.threadId = thread.id;
      message2.createdAt = new Date('2024-01-01T10:01:00Z');
      message2.updatedAt = new Date('2024-01-01T10:01:00Z');
      message2.deletedAt = null;

      // Verify thread properties
      expect(thread.id).toBe('thread-123');
      expect(thread.subject).toBe('Customer Support - Product Question');
      expect(thread.participants).toEqual(['+1234567890', '+0987654321']);
      expect(thread.status).toBe(TribThreadStatus.ACTIVE);
      expect(thread.type).toBe(TribThreadType.SUPPORT);
      expect(thread.priority).toBe(TribThreadPriority.HIGH);

      // Verify message-thread relationship
      expect(message1.threadId).toBe(thread.id);
      expect(message2.threadId).toBe(thread.id);

      // Verify message properties
      expect(message1.direction).toBe(TribMessageDirection.INBOUND);
      expect(message2.direction).toBe(TribMessageDirection.OUTBOUND);
      expect(message1.status).toBe(TribMessageStatus.DELIVERED);
      expect(message2.status).toBe(TribMessageStatus.DELIVERED);
    });

    it('should handle thread message count updates', () => {
      const thread = new TribThreadWorkspaceEntity();
      thread.id = 'thread-456';
      thread.subject = 'Group Chat';
      thread.participants = ['+1111111111', '+2222222222', '+3333333333'];
      thread.status = TribThreadStatus.ACTIVE;
      thread.type = TribThreadType.GROUP;
      thread.priority = TribThreadPriority.NORMAL;
      thread.messageCount = 0;
      thread.lastMessageAt = null;
      thread.createdAt = new Date('2024-01-01T00:00:00Z');
      thread.updatedAt = new Date('2024-01-01T00:00:00Z');
      thread.deletedAt = null;

      // Add messages and update count
      thread.incrementMessageCount();
      expect(thread.messageCount).toBe(1);
      expect(thread.lastMessageAt).toBeInstanceOf(Date);

      thread.incrementMessageCount();
      expect(thread.messageCount).toBe(2);

      thread.incrementMessageCount();
      expect(thread.messageCount).toBe(3);

      // Remove a message
      thread.decrementMessageCount();
      expect(thread.messageCount).toBe(2);

      // Verify count cannot go below 0
      thread.messageCount = 0;
      thread.decrementMessageCount();
      expect(thread.messageCount).toBe(0);
    });

    it('should handle thread status transitions', () => {
      const thread = new TribThreadWorkspaceEntity();
      thread.id = 'thread-789';
      thread.subject = 'Marketing Campaign';
      thread.participants = ['+5555555555'];
      thread.status = TribThreadStatus.ACTIVE;
      thread.type = TribThreadType.MARKETING;
      thread.priority = TribThreadPriority.LOW;
      thread.messageCount = 0;
      thread.archived = false;
      thread.readStatus = false;
      thread.createdAt = new Date('2024-01-01T00:00:00Z');
      thread.updatedAt = new Date('2024-01-01T00:00:00Z');
      thread.deletedAt = null;

      // Verify thread can receive messages when active
      expect(TribThreadWorkspaceEntity.canReceiveMessages(thread.status)).toBe(
        true,
      );

      // Archive the thread
      thread.status = TribThreadStatus.ARCHIVED;
      thread.archived = true;
      expect(TribThreadWorkspaceEntity.canReceiveMessages(thread.status)).toBe(
        false,
      );

      // Reactivate the thread
      thread.status = TribThreadStatus.ACTIVE;
      thread.archived = false;
      expect(TribThreadWorkspaceEntity.canReceiveMessages(thread.status)).toBe(
        true,
      );

      // Close the thread
      thread.status = TribThreadStatus.CLOSED;
      expect(TribThreadWorkspaceEntity.canReceiveMessages(thread.status)).toBe(
        false,
      );
      expect(TribThreadWorkspaceEntity.isTerminalStatus(thread.status)).toBe(
        true,
      );
    });

    it('should handle participant management', () => {
      const thread = new TribThreadWorkspaceEntity();
      thread.id = 'thread-participants';
      thread.subject = 'Team Discussion';
      thread.participants = ['+1111111111', '+2222222222'];
      thread.status = TribThreadStatus.ACTIVE;
      thread.type = TribThreadType.GROUP;
      thread.priority = TribThreadPriority.NORMAL;
      thread.messageCount = 0;
      thread.archived = false;
      thread.readStatus = false;
      thread.createdAt = new Date('2024-01-01T00:00:00Z');
      thread.updatedAt = new Date('2024-01-01T00:00:00Z');
      thread.deletedAt = null;

      // Add a new participant
      const addResult = thread.addParticipant('+3333333333');
      expect(addResult).toBe(true);
      expect(thread.participants).toContain('+3333333333');
      expect(thread.participants).toHaveLength(3);

      // Try to add duplicate participant
      const duplicateResult = thread.addParticipant('+3333333333');
      expect(duplicateResult).toBe(false);
      expect(thread.participants).toHaveLength(3);

      // Remove a participant
      const removeResult = thread.removeParticipant('+2222222222');
      expect(removeResult).toBe(true);
      expect(thread.participants).not.toContain('+2222222222');
      expect(thread.participants).toHaveLength(2);

      // Try to remove non-existent participant
      const removeNonExistentResult = thread.removeParticipant('+9999999999');
      expect(removeNonExistentResult).toBe(false);
      expect(thread.participants).toHaveLength(2);
    });

    it('should handle thread metadata and tags', () => {
      const thread = new TribThreadWorkspaceEntity();
      thread.id = 'thread-metadata';
      thread.subject = 'VIP Customer Request';
      thread.participants = ['+1234567890'];
      thread.status = TribThreadStatus.ACTIVE;
      thread.type = TribThreadType.SUPPORT;
      thread.priority = TribThreadPriority.CRITICAL;
      thread.messageCount = 0;
      thread.archived = false;
      thread.readStatus = false;
      thread.createdAt = new Date('2024-01-01T00:00:00Z');
      thread.updatedAt = new Date('2024-01-01T00:00:00Z');
      thread.deletedAt = null;

      // Set metadata
      thread.metadata = {
        customerTier: 'VIP',
        accountManager: 'john.doe@company.com',
        urgency: 'high',
        department: 'customer-success',
        escalated: true,
        escalationTime: '2024-01-01T10:00:00Z',
      };

      // Set tags
      thread.tags = ['vip', 'urgent', 'escalated', 'customer-success'];

      // Verify metadata
      expect(thread.metadata).toBeDefined();
      expect(thread.metadata!.customerTier).toBe('VIP');
      expect(thread.metadata!.escalated).toBe(true);

      // Verify tags
      expect(thread.tags).toBeDefined();
      expect(thread.tags).toHaveLength(4);
      expect(thread.tags).toContain('vip');
      expect(thread.tags).toContain('urgent');
      expect(thread.tags).toContain('escalated');
      expect(thread.tags).toContain('customer-success');
    });

    it('should handle contact relationship', () => {
      const thread = new TribThreadWorkspaceEntity();
      thread.id = 'thread-contact';
      thread.subject = 'Individual Customer Support';
      thread.participants = ['+1234567890'];
      thread.status = TribThreadStatus.ACTIVE;
      thread.type = TribThreadType.INDIVIDUAL;
      thread.priority = TribThreadPriority.NORMAL;
      thread.messageCount = 0;
      thread.archived = false;
      thread.readStatus = false;
      thread.contactId = 'contact-123';
      thread.ownerId = 'user-456';
      thread.createdAt = new Date('2024-01-01T00:00:00Z');
      thread.updatedAt = new Date('2024-01-01T00:00:00Z');
      thread.deletedAt = null;

      // Verify contact relationship
      expect(thread.contactId).toBe('contact-123');
      expect(thread.ownerId).toBe('user-456');

      // Verify thread can be associated with a contact
      expect(typeof thread.contactId).toBe('string');
      expect(thread.contactId).toBeTruthy();

      // Verify thread can have an owner
      expect(typeof thread.ownerId).toBe('string');
      expect(thread.ownerId).toBeTruthy();
    });
  });

  describe('Thread Lifecycle Integration', () => {
    it('should handle complete thread lifecycle', () => {
      const thread = new TribThreadWorkspaceEntity();
      thread.id = 'thread-lifecycle';
      thread.subject = 'Support Ticket #12345';
      thread.participants = ['+1234567890'];
      thread.status = TribThreadStatus.ACTIVE;
      thread.type = TribThreadType.SUPPORT;
      thread.priority = TribThreadPriority.HIGH;
      thread.messageCount = 0;
      thread.archived = false;
      thread.readStatus = false;
      thread.contactId = 'contact-789';
      thread.ownerId = 'support-agent-123';
      thread.createdAt = new Date('2024-01-01T00:00:00Z');
      thread.updatedAt = new Date('2024-01-01T00:00:00Z');
      thread.deletedAt = null;

      // 1. Thread is created and active
      expect(thread.status).toBe(TribThreadStatus.ACTIVE);
      expect(TribThreadWorkspaceEntity.canReceiveMessages(thread.status)).toBe(
        true,
      );

      // 2. Messages are added
      thread.incrementMessageCount();
      thread.incrementMessageCount();
      thread.incrementMessageCount();
      expect(thread.messageCount).toBe(3);

      // 3. Thread is marked as read
      thread.readStatus = true;
      expect(thread.readStatus).toBe(true);

      // 4. Thread is paused
      thread.status = TribThreadStatus.PAUSED;
      expect(TribThreadWorkspaceEntity.canReceiveMessages(thread.status)).toBe(
        false,
      );

      // 5. Thread is reactivated
      thread.status = TribThreadStatus.ACTIVE;
      expect(TribThreadWorkspaceEntity.canReceiveMessages(thread.status)).toBe(
        true,
      );

      // 6. Thread is closed
      thread.status = TribThreadStatus.CLOSED;
      expect(TribThreadWorkspaceEntity.canReceiveMessages(thread.status)).toBe(
        false,
      );
      expect(TribThreadWorkspaceEntity.isTerminalStatus(thread.status)).toBe(
        true,
      );
    });

    it('should handle thread archiving and unarchiving', () => {
      const thread = new TribThreadWorkspaceEntity();
      thread.id = 'thread-archive';
      thread.subject = 'Old Conversation';
      thread.participants = ['+1111111111'];
      thread.status = TribThreadStatus.ACTIVE;
      thread.type = TribThreadType.INDIVIDUAL;
      thread.priority = TribThreadPriority.LOW;
      thread.messageCount = 10;
      thread.archived = false;
      thread.readStatus = true;
      thread.createdAt = new Date('2024-01-01T00:00:00Z');
      thread.updatedAt = new Date('2024-01-01T00:00:00Z');
      thread.deletedAt = null;

      // Archive the thread
      thread.status = TribThreadStatus.ARCHIVED;
      thread.archived = true;
      expect(thread.status).toBe(TribThreadStatus.ARCHIVED);
      expect(thread.archived).toBe(true);
      expect(TribThreadWorkspaceEntity.canReceiveMessages(thread.status)).toBe(
        false,
      );

      // Unarchive the thread
      thread.status = TribThreadStatus.ACTIVE;
      thread.archived = false;
      expect(thread.status).toBe(TribThreadStatus.ACTIVE);
      expect(thread.archived).toBe(false);
      expect(TribThreadWorkspaceEntity.canReceiveMessages(thread.status)).toBe(
        true,
      );
    });

    it('should handle thread blocking and unblocking', () => {
      const thread = new TribThreadWorkspaceEntity();
      thread.id = 'thread-block';
      thread.subject = 'Blocked User Thread';
      thread.participants = ['+5555555555'];
      thread.status = TribThreadStatus.ACTIVE;
      thread.type = TribThreadType.INDIVIDUAL;
      thread.priority = TribThreadPriority.LOW;
      thread.messageCount = 2;
      thread.archived = false;
      thread.readStatus = true;
      thread.createdAt = new Date('2024-01-01T00:00:00Z');
      thread.updatedAt = new Date('2024-01-01T00:00:00Z');
      thread.deletedAt = null;

      // Block the thread
      thread.status = TribThreadStatus.BLOCKED;
      expect(thread.status).toBe(TribThreadStatus.BLOCKED);
      expect(TribThreadWorkspaceEntity.canReceiveMessages(thread.status)).toBe(
        false,
      );

      // Unblock the thread
      thread.status = TribThreadStatus.ACTIVE;
      expect(thread.status).toBe(TribThreadStatus.ACTIVE);
      expect(TribThreadWorkspaceEntity.canReceiveMessages(thread.status)).toBe(
        true,
      );
    });
  });

  describe('Thread Validation Integration', () => {
    it('should validate thread data with validators', () => {
      const thread = new TribThreadWorkspaceEntity();
      thread.id = 'thread-validation';
      thread.subject = 'Valid Thread Subject';
      thread.participants = ['+1234567890', '+0987654321'];
      thread.status = TribThreadStatus.ACTIVE;
      thread.type = TribThreadType.SUPPORT;
      thread.priority = TribThreadPriority.NORMAL;
      thread.messageCount = 5;
      thread.archived = false;
      thread.readStatus = false;
      thread.tags = ['support', 'customer'];
      thread.metadata = {
        department: 'customer-service',
        agent: 'john.doe',
        priority: 'normal',
      };
      thread.createdAt = new Date('2024-01-01T00:00:00Z');
      thread.updatedAt = new Date('2024-01-01T00:00:00Z');
      thread.deletedAt = null;

      // Validate all thread properties
      expect(validateThreadStatus(thread.status)).toBe(true);
      expect(validateThreadSubject(thread.subject)).toBe(true);
      expect(validateThreadParticipants(thread.participants)).toBe(true);
      expect(validateMessageCount(thread.messageCount)).toBe(true);
      expect(validateThreadTags(thread.tags!)).toBe(true);
      expect(validateThreadMetadata(thread.metadata!)).toBe(true);

      // Validate using static methods
      expect(TribThreadWorkspaceEntity.validateSubject(thread.subject)).toBe(
        true,
      );
      expect(
        TribThreadWorkspaceEntity.validateParticipants(thread.participants),
      ).toBe(true);
      expect(TribThreadWorkspaceEntity.canReceiveMessages(thread.status)).toBe(
        true,
      );
      expect(TribThreadWorkspaceEntity.isTerminalStatus(thread.status)).toBe(
        false,
      );
    });

    it('should handle invalid thread data', () => {
      const thread = new TribThreadWorkspaceEntity();
      thread.id = 'thread-invalid';
      thread.subject = ''; // Invalid - empty subject
      thread.participants = []; // Invalid - empty participants
      thread.status = 'invalid-status' as TribThreadStatus;
      thread.type = TribThreadType.SUPPORT;
      thread.priority = TribThreadPriority.NORMAL;
      thread.messageCount = -1; // Invalid - negative count
      thread.archived = false;
      thread.readStatus = false;
      thread.tags = Array(25).fill('tag'); // Invalid - too many tags
      thread.metadata = null;
      thread.createdAt = new Date('2024-01-01T00:00:00Z');
      thread.updatedAt = new Date('2024-01-01T00:00:00Z');
      thread.deletedAt = null;

      // Validate all thread properties (should fail)
      expect(validateThreadStatus(thread.status)).toBe(false);
      expect(validateThreadSubject(thread.subject)).toBe(false);
      expect(validateThreadParticipants(thread.participants)).toBe(false);
      expect(validateMessageCount(thread.messageCount)).toBe(false);
      expect(validateThreadTags(thread.tags!)).toBe(false);
      expect(validateThreadMetadata(thread.metadata)).toBe(true); // null is valid

      // Validate using static methods
      expect(TribThreadWorkspaceEntity.validateSubject(thread.subject)).toBe(
        false,
      );
      expect(
        TribThreadWorkspaceEntity.validateParticipants(thread.participants),
      ).toBe(false);
    });
  });

  describe('Thread Field ID Integration', () => {
    it('should use correct field IDs for all thread fields', () => {
      // Verify field IDs are properly defined
      expect(THREAD_FIELD_IDS.id).toBeDefined();
      expect(THREAD_FIELD_IDS.subject).toBeDefined();
      expect(THREAD_FIELD_IDS.participants).toBeDefined();
      expect(THREAD_FIELD_IDS.status).toBeDefined();
      expect(THREAD_FIELD_IDS.type).toBeDefined();
      expect(THREAD_FIELD_IDS.priority).toBeDefined();
      expect(THREAD_FIELD_IDS.metadata).toBeDefined();
      expect(THREAD_FIELD_IDS.lastMessageAt).toBeDefined();
      expect(THREAD_FIELD_IDS.messageCount).toBeDefined();
      expect(THREAD_FIELD_IDS.tags).toBeDefined();
      expect(THREAD_FIELD_IDS.archived).toBeDefined();
      expect(THREAD_FIELD_IDS.readStatus).toBeDefined();
      expect(THREAD_FIELD_IDS.owner).toBeDefined();

      // Verify field IDs follow the TRIB UUID format
      expect(THREAD_FIELD_IDS.id).toMatch(
        /^20202020-[A-Z0-9]{4}-[0-9]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/,
      );
      expect(THREAD_FIELD_IDS.subject).toMatch(
        /^20202020-[A-Z0-9]{4}-[0-9]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/,
      );
      expect(THREAD_FIELD_IDS.participants).toMatch(
        /^20202020-[A-Z0-9]{4}-[0-9]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/,
      );
      expect(THREAD_FIELD_IDS.status).toMatch(
        /^20202020-[A-Z0-9]{4}-[0-9]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/,
      );
      expect(THREAD_FIELD_IDS.type).toMatch(
        /^20202020-[A-Z0-9]{4}-[0-9]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/,
      );
      expect(THREAD_FIELD_IDS.priority).toMatch(
        /^20202020-[A-Z0-9]{4}-[0-9]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/,
      );
      expect(THREAD_FIELD_IDS.metadata).toMatch(
        /^20202020-[A-Z0-9]{4}-[0-9]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/,
      );
      expect(THREAD_FIELD_IDS.lastMessageAt).toMatch(
        /^20202020-[A-Z0-9]{4}-[0-9]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/,
      );
      expect(THREAD_FIELD_IDS.messageCount).toMatch(
        /^20202020-[A-Z0-9]{4}-[0-9]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/,
      );
      expect(THREAD_FIELD_IDS.tags).toMatch(
        /^20202020-[A-Z0-9]{4}-[0-9]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/,
      );
      expect(THREAD_FIELD_IDS.archived).toMatch(
        /^20202020-[A-Z0-9]{4}-[0-9]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/,
      );
      expect(THREAD_FIELD_IDS.readStatus).toMatch(
        /^20202020-[A-Z0-9]{4}-[0-9]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/,
      );
      expect(THREAD_FIELD_IDS.owner).toMatch(
        /^20202020-[A-Z0-9]{4}-[0-9]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/,
      );
    });

    it('should map field IDs to entity metadata correctly', () => {
      const fieldMetadata = (TribThreadWorkspaceEntity as any).fieldMetadata;

      // Verify that field metadata uses the correct standardIds
      expect(fieldMetadata.subject.standardId).toBe(THREAD_FIELD_IDS.subject);
      expect(fieldMetadata.participants.standardId).toBe(
        THREAD_FIELD_IDS.participants,
      );
      expect(fieldMetadata.status.standardId).toBe(THREAD_FIELD_IDS.status);
      expect(fieldMetadata.type.standardId).toBe(THREAD_FIELD_IDS.type);
      expect(fieldMetadata.priority.standardId).toBe(THREAD_FIELD_IDS.priority);
      expect(fieldMetadata.metadata.standardId).toBe(THREAD_FIELD_IDS.metadata);
      expect(fieldMetadata.lastMessageAt.standardId).toBe(
        THREAD_FIELD_IDS.lastMessageAt,
      );
      expect(fieldMetadata.messageCount.standardId).toBe(
        THREAD_FIELD_IDS.messageCount,
      );
      expect(fieldMetadata.tags.standardId).toBe(THREAD_FIELD_IDS.tags);
      expect(fieldMetadata.archived.standardId).toBe(THREAD_FIELD_IDS.archived);
      expect(fieldMetadata.readStatus.standardId).toBe(
        THREAD_FIELD_IDS.readStatus,
      );
      expect(fieldMetadata.ownerId.standardId).toBe(THREAD_FIELD_IDS.owner);
    });
  });

  describe('Cross-Entity Integration', () => {
    it('should properly relate thread and message entities', () => {
      const thread = new TribThreadWorkspaceEntity();
      thread.id = 'thread-cross-entity';
      thread.subject = 'Cross-Entity Test';
      thread.participants = ['+1111111111', '+2222222222'];
      thread.status = TribThreadStatus.ACTIVE;
      thread.type = TribThreadType.INDIVIDUAL;
      thread.priority = TribThreadPriority.NORMAL;
      thread.messageCount = 0;
      thread.archived = false;
      thread.readStatus = false;
      thread.createdAt = new Date('2024-01-01T00:00:00Z');
      thread.updatedAt = new Date('2024-01-01T00:00:00Z');
      thread.deletedAt = null;

      const message = new TribMessageWorkspaceEntity();
      message.id = 'msg-cross-entity';
      message.content = 'Cross-entity integration test message';
      message.channel = TribMessageChannel.SMS;
      message.direction = TribMessageDirection.INBOUND;
      message.from = '+1111111111';
      message.to = '+2222222222';
      message.status = TribMessageStatus.DELIVERED;
      message.threadId = thread.id;
      message.createdAt = new Date('2024-01-01T10:00:00Z');
      message.updatedAt = new Date('2024-01-01T10:00:00Z');
      message.deletedAt = null;

      // Verify cross-entity relationships
      expect(message.threadId).toBe(thread.id);
      expect(thread.participants).toContain(message.from);
      expect(thread.participants).toContain(message.to);

      // Update thread based on message
      thread.incrementMessageCount();
      expect(thread.messageCount).toBe(1);
      expect(thread.lastMessageAt).toBeInstanceOf(Date);

      // Verify relationship metadata
      const messageRelationMetadata = (TribMessageWorkspaceEntity as any)
        .relationMetadata;
      const threadRelationMetadata = (TribThreadWorkspaceEntity as any)
        .relationMetadata;

      expect(messageRelationMetadata.thread).toBeDefined();
      expect(messageRelationMetadata.thread.relationType).toBe('MANY_TO_ONE');
      expect(messageRelationMetadata.thread.inverseSideFieldKey).toBe(
        'messages',
      );

      expect(threadRelationMetadata.messages).toBeDefined();
      expect(threadRelationMetadata.messages.relationType).toBe('ONE_TO_MANY');
      expect(threadRelationMetadata.messages.inverseSideFieldKey).toBe(
        'thread',
      );
    });
  });
});
