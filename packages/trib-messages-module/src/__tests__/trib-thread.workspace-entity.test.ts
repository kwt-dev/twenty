import { TribThreadWorkspaceEntity } from '../standard-objects/trib-thread.workspace-entity';
import {
  TribThreadStatus,
  TribThreadType,
  TribThreadPriority,
} from '../types/thread-enums';
import { THREAD_FIELD_IDS } from '../constants/trib-standard-field-ids';
import { TRIB_CONTACT_OBJECT_IDS } from '../constants/trib-standard-object-ids';

describe('TribThreadWorkspaceEntity', () => {
  let thread: TribThreadWorkspaceEntity;

  beforeEach(() => {
    thread = new TribThreadWorkspaceEntity();
    thread.id = 'test-thread-id';
    thread.subject = 'Test Thread Subject';
    thread.participants = ['+1234567890'];
    thread.status = TribThreadStatus.ACTIVE;
    thread.type = TribThreadType.INDIVIDUAL;
    thread.priority = TribThreadPriority.NORMAL;
    thread.messageCount = 0;
    thread.archived = false;
    thread.readStatus = false;
    thread.createdAt = new Date('2024-01-01T00:00:00Z');
    thread.updatedAt = new Date('2024-01-01T00:00:00Z');
    thread.deletedAt = null;
  });

  describe('Entity Configuration', () => {
    it('should have correct workspace entity metadata', () => {
      expect(
        (TribThreadWorkspaceEntity as any).workspaceMetadata,
      ).toBeDefined();
      expect(
        (TribThreadWorkspaceEntity as any).workspaceMetadata.standardId,
      ).toBe(TRIB_CONTACT_OBJECT_IDS.CONTACT_THREAD);
      expect(
        (TribThreadWorkspaceEntity as any).workspaceMetadata.namePlural,
      ).toBe('tribThreads');
      expect(
        (TribThreadWorkspaceEntity as any).workspaceMetadata.labelSingular,
      ).toBe('TRIB Thread');
      expect(
        (TribThreadWorkspaceEntity as any).workspaceMetadata.labelPlural,
      ).toBe('TRIB Threads');
      expect(
        (TribThreadWorkspaceEntity as any).workspaceMetadata.description,
      ).toBe('A conversation thread in the TRIB messaging system');
      expect((TribThreadWorkspaceEntity as any).workspaceMetadata.icon).toBe(
        'IconMessageCircle',
      );
      expect(
        (TribThreadWorkspaceEntity as any).workspaceMetadata.shortcut,
      ).toBe('H');
      expect(
        (TribThreadWorkspaceEntity as any).workspaceMetadata
          .labelIdentifierStandardId,
      ).toBe(THREAD_FIELD_IDS.subject);
    });

    it('should have field metadata for all fields', () => {
      const fieldMetadata = (TribThreadWorkspaceEntity as any).fieldMetadata;
      expect(fieldMetadata).toBeDefined();

      // Check key fields have metadata
      expect(fieldMetadata.subject).toBeDefined();
      expect(fieldMetadata.subject.standardId).toBe(THREAD_FIELD_IDS.subject);
      expect(fieldMetadata.subject.type).toBe('TEXT');

      expect(fieldMetadata.status).toBeDefined();
      expect(fieldMetadata.status.standardId).toBe(THREAD_FIELD_IDS.status);
      expect(fieldMetadata.status.type).toBe('SELECT');

      expect(fieldMetadata.participants).toBeDefined();
      expect(fieldMetadata.participants.standardId).toBe(
        THREAD_FIELD_IDS.participants,
      );
      expect(fieldMetadata.participants.type).toBe('RAW_JSON');

      expect(fieldMetadata.messageCount).toBeDefined();
      expect(fieldMetadata.messageCount.standardId).toBe(
        THREAD_FIELD_IDS.messageCount,
      );
      expect(fieldMetadata.messageCount.type).toBe('NUMBER');
    });

    it('should have correct nullable field configuration', () => {
      const nullableFields = (TribThreadWorkspaceEntity as any).nullableFields;
      expect(nullableFields).toBeDefined();
      expect(nullableFields).toContain('subject');
      expect(nullableFields).toContain('metadata');
      expect(nullableFields).toContain('lastMessageAt');
      expect(nullableFields).toContain('tags');
      expect(nullableFields).toContain('ownerId');
      expect(nullableFields).toContain('contact');
      expect(nullableFields).toContain('contactId');
    });

    it('should have correct relation metadata', () => {
      const relationMetadata = (TribThreadWorkspaceEntity as any)
        .relationMetadata;
      expect(relationMetadata).toBeDefined();

      expect(relationMetadata.messages).toBeDefined();
      expect(relationMetadata.messages.relationType).toBe('ONE_TO_MANY');
      expect(relationMetadata.messages.inverseSideFieldKey).toBe('thread');
      expect(relationMetadata.messages.onDelete).toBe('CASCADE');

      expect(relationMetadata.contact).toBeDefined();
      expect(relationMetadata.contact.relationType).toBe('MANY_TO_ONE');
      expect(relationMetadata.contact.inverseSideFieldKey).toBe('tribThreads');
      expect(relationMetadata.contact.onDelete).toBe('SET_NULL');
    });

    it('should have correct join column configuration', () => {
      const joinColumns = (TribThreadWorkspaceEntity as any).joinColumns;
      expect(joinColumns).toBeDefined();
      expect(joinColumns.contact).toBe('contactId');
    });
  });

  describe('Instance Creation and Properties', () => {
    it('should create a new thread instance with default values', () => {
      const newThread = new TribThreadWorkspaceEntity();
      expect(newThread).toBeInstanceOf(TribThreadWorkspaceEntity);
      expect(newThread.id).toBeUndefined();
      expect(newThread.subject).toBeUndefined();
      expect(newThread.participants).toBeUndefined();
      expect(newThread.status).toBeUndefined();
      expect(newThread.type).toBeUndefined();
      expect(newThread.priority).toBeUndefined();
      expect(newThread.messageCount).toBeUndefined();
      expect(newThread.archived).toBeUndefined();
      expect(newThread.readStatus).toBeUndefined();
    });

    it('should allow setting all properties', () => {
      const testDate = new Date('2024-01-01T12:00:00Z');
      const testMetadata = { key: 'value' };
      const testTags = ['tag1', 'tag2'];
      const testParticipants = ['+1234567890', '+0987654321'];

      thread.subject = 'Updated Subject';
      thread.participants = testParticipants;
      thread.status = TribThreadStatus.ARCHIVED;
      thread.type = TribThreadType.GROUP;
      thread.priority = TribThreadPriority.HIGH;
      thread.metadata = testMetadata;
      thread.lastMessageAt = testDate;
      thread.messageCount = 5;
      thread.tags = testTags;
      thread.archived = true;
      thread.readStatus = true;
      thread.ownerId = 'owner-123';
      thread.contactId = 'contact-456';

      expect(thread.subject).toBe('Updated Subject');
      expect(thread.participants).toEqual(testParticipants);
      expect(thread.status).toBe(TribThreadStatus.ARCHIVED);
      expect(thread.type).toBe(TribThreadType.GROUP);
      expect(thread.priority).toBe(TribThreadPriority.HIGH);
      expect(thread.metadata).toEqual(testMetadata);
      expect(thread.lastMessageAt).toBe(testDate);
      expect(thread.messageCount).toBe(5);
      expect(thread.tags).toEqual(testTags);
      expect(thread.archived).toBe(true);
      expect(thread.readStatus).toBe(true);
      expect(thread.ownerId).toBe('owner-123');
      expect(thread.contactId).toBe('contact-456');
    });

    it('should handle null values for nullable fields', () => {
      thread.subject = null;
      thread.metadata = null;
      thread.lastMessageAt = null;
      thread.tags = null;
      thread.ownerId = null;
      thread.contactId = null;

      expect(thread.subject).toBeNull();
      expect(thread.metadata).toBeNull();
      expect(thread.lastMessageAt).toBeNull();
      expect(thread.tags).toBeNull();
      expect(thread.ownerId).toBeNull();
      expect(thread.contactId).toBeNull();
    });
  });

  describe('Static Validation Methods', () => {
    describe('validateParticipants', () => {
      it('should validate valid participants array', () => {
        const validParticipants = ['+1234567890', '+0987654321'];
        expect(
          TribThreadWorkspaceEntity.validateParticipants(validParticipants),
        ).toBe(true);
      });

      it('should validate single participant', () => {
        const singleParticipant = ['+1234567890'];
        expect(
          TribThreadWorkspaceEntity.validateParticipants(singleParticipant),
        ).toBe(true);
      });

      it('should reject empty array', () => {
        expect(TribThreadWorkspaceEntity.validateParticipants([])).toBe(false);
      });

      it('should reject non-array input', () => {
        expect(
          TribThreadWorkspaceEntity.validateParticipants('not-an-array' as any),
        ).toBe(false);
        expect(
          TribThreadWorkspaceEntity.validateParticipants(null as any),
        ).toBe(false);
        expect(
          TribThreadWorkspaceEntity.validateParticipants(undefined as any),
        ).toBe(false);
      });

      it('should reject empty string participants', () => {
        const invalidParticipants = ['', '  ', '+1234567890'];
        expect(
          TribThreadWorkspaceEntity.validateParticipants(invalidParticipants),
        ).toBe(false);
      });

      it('should reject non-string participants', () => {
        const invalidParticipants = [123, '+1234567890'] as any;
        expect(
          TribThreadWorkspaceEntity.validateParticipants(invalidParticipants),
        ).toBe(false);
      });

      it('should reject too many participants', () => {
        const tooManyParticipants = Array(101)
          .fill(0)
          .map((_, i) => `+123456789${i}`);
        expect(
          TribThreadWorkspaceEntity.validateParticipants(tooManyParticipants),
        ).toBe(false);
      });

      it('should reject participants with overly long identifiers', () => {
        const longParticipant = '+' + '1'.repeat(50); // 51 characters
        expect(
          TribThreadWorkspaceEntity.validateParticipants([longParticipant]),
        ).toBe(false);
      });
    });

    describe('validateSubject', () => {
      it('should validate valid subject', () => {
        expect(TribThreadWorkspaceEntity.validateSubject('Valid Subject')).toBe(
          true,
        );
      });

      it('should validate null subject', () => {
        expect(TribThreadWorkspaceEntity.validateSubject(null)).toBe(true);
      });

      it('should validate undefined subject', () => {
        expect(
          TribThreadWorkspaceEntity.validateSubject(undefined as any),
        ).toBe(true);
      });

      it('should reject empty string subject', () => {
        expect(TribThreadWorkspaceEntity.validateSubject('')).toBe(false);
        expect(TribThreadWorkspaceEntity.validateSubject('   ')).toBe(false);
      });

      it('should reject non-string subject', () => {
        expect(TribThreadWorkspaceEntity.validateSubject(123 as any)).toBe(
          false,
        );
        expect(TribThreadWorkspaceEntity.validateSubject([] as any)).toBe(
          false,
        );
        expect(TribThreadWorkspaceEntity.validateSubject({} as any)).toBe(
          false,
        );
      });

      it('should reject overly long subject', () => {
        const longSubject = 'a'.repeat(201);
        expect(TribThreadWorkspaceEntity.validateSubject(longSubject)).toBe(
          false,
        );
      });

      it('should validate subject at maximum length', () => {
        const maxLengthSubject = 'a'.repeat(200);
        expect(
          TribThreadWorkspaceEntity.validateSubject(maxLengthSubject),
        ).toBe(true);
      });
    });

    describe('canReceiveMessages', () => {
      it('should return true for ACTIVE status', () => {
        expect(
          TribThreadWorkspaceEntity.canReceiveMessages(TribThreadStatus.ACTIVE),
        ).toBe(true);
      });

      it('should return false for non-ACTIVE statuses', () => {
        expect(
          TribThreadWorkspaceEntity.canReceiveMessages(
            TribThreadStatus.ARCHIVED,
          ),
        ).toBe(false);
        expect(
          TribThreadWorkspaceEntity.canReceiveMessages(
            TribThreadStatus.BLOCKED,
          ),
        ).toBe(false);
        expect(
          TribThreadWorkspaceEntity.canReceiveMessages(TribThreadStatus.CLOSED),
        ).toBe(false);
        expect(
          TribThreadWorkspaceEntity.canReceiveMessages(TribThreadStatus.PAUSED),
        ).toBe(false);
      });
    });

    describe('isTerminalStatus', () => {
      it('should return true for CLOSED status', () => {
        expect(
          TribThreadWorkspaceEntity.isTerminalStatus(TribThreadStatus.CLOSED),
        ).toBe(true);
      });

      it('should return false for non-terminal statuses', () => {
        expect(
          TribThreadWorkspaceEntity.isTerminalStatus(TribThreadStatus.ACTIVE),
        ).toBe(false);
        expect(
          TribThreadWorkspaceEntity.isTerminalStatus(TribThreadStatus.ARCHIVED),
        ).toBe(false);
        expect(
          TribThreadWorkspaceEntity.isTerminalStatus(TribThreadStatus.BLOCKED),
        ).toBe(false);
        expect(
          TribThreadWorkspaceEntity.isTerminalStatus(TribThreadStatus.PAUSED),
        ).toBe(false);
      });
    });
  });

  describe('Instance Methods', () => {
    describe('incrementMessageCount', () => {
      it('should increment message count from 0', () => {
        thread.messageCount = 0;
        const beforeTime = new Date();

        thread.incrementMessageCount();

        expect(thread.messageCount).toBe(1);
        expect(thread.lastMessageAt).toBeInstanceOf(Date);
        expect(thread.lastMessageAt!.getTime()).toBeGreaterThanOrEqual(
          beforeTime.getTime(),
        );
      });

      it('should increment message count from existing value', () => {
        thread.messageCount = 5;

        thread.incrementMessageCount();

        expect(thread.messageCount).toBe(6);
        expect(thread.lastMessageAt).toBeInstanceOf(Date);
      });

      it('should handle undefined message count', () => {
        thread.messageCount = undefined as any;

        thread.incrementMessageCount();

        expect(thread.messageCount).toBe(1);
        expect(thread.lastMessageAt).toBeInstanceOf(Date);
      });
    });

    describe('decrementMessageCount', () => {
      it('should decrement message count', () => {
        thread.messageCount = 5;

        thread.decrementMessageCount();

        expect(thread.messageCount).toBe(4);
      });

      it('should not go below 0', () => {
        thread.messageCount = 0;

        thread.decrementMessageCount();

        expect(thread.messageCount).toBe(0);
      });

      it('should handle undefined message count', () => {
        thread.messageCount = undefined as any;

        thread.decrementMessageCount();

        expect(thread.messageCount).toBe(0);
      });
    });

    describe('updateLastMessageAt', () => {
      it('should update last message timestamp', () => {
        const testDate = new Date('2024-01-01T12:00:00Z');

        thread.updateLastMessageAt(testDate);

        expect(thread.lastMessageAt).toBe(testDate);
      });
    });

    describe('isParticipantOptedOut', () => {
      it('should return false for any participant (placeholder implementation)', () => {
        expect(thread.isParticipantOptedOut('+1234567890')).toBe(false);
        expect(thread.isParticipantOptedOut('user@example.com')).toBe(false);
      });
    });

    describe('addParticipant', () => {
      beforeEach(() => {
        thread.participants = ['+1234567890'];
      });

      it('should add new participant', () => {
        const result = thread.addParticipant('+0987654321');

        expect(result).toBe(true);
        expect(thread.participants).toEqual(['+1234567890', '+0987654321']);
      });

      it('should reject duplicate participant', () => {
        const result = thread.addParticipant('+1234567890');

        expect(result).toBe(false);
        expect(thread.participants).toEqual(['+1234567890']);
      });

      it('should reject empty participant', () => {
        const result = thread.addParticipant('');

        expect(result).toBe(false);
        expect(thread.participants).toEqual(['+1234567890']);
      });

      it('should reject non-string participant', () => {
        const result = thread.addParticipant(123 as any);

        expect(result).toBe(false);
        expect(thread.participants).toEqual(['+1234567890']);
      });

      it('should reject when at maximum participants', () => {
        thread.participants = Array(100)
          .fill(0)
          .map((_, i) => `+123456789${i.toString().padStart(2, '0')}`);

        const result = thread.addParticipant('+9999999999');

        expect(result).toBe(false);
        expect(thread.participants.length).toBe(100);
      });
    });

    describe('removeParticipant', () => {
      beforeEach(() => {
        thread.participants = ['+1234567890', '+0987654321'];
      });

      it('should remove existing participant', () => {
        const result = thread.removeParticipant('+1234567890');

        expect(result).toBe(true);
        expect(thread.participants).toEqual(['+0987654321']);
      });

      it('should reject non-existing participant', () => {
        const result = thread.removeParticipant('+5555555555');

        expect(result).toBe(false);
        expect(thread.participants).toEqual(['+1234567890', '+0987654321']);
      });

      it('should handle empty participants array', () => {
        thread.participants = [];

        const result = thread.removeParticipant('+1234567890');

        expect(result).toBe(false);
        expect(thread.participants).toEqual([]);
      });
    });
  });

  describe('Enum Values and Options', () => {
    it('should have correct status options', () => {
      const statusField = (TribThreadWorkspaceEntity as any).fieldMetadata
        .status;
      expect(statusField.options).toBeDefined();
      expect(statusField.options).toHaveLength(5);

      const statusValues = statusField.options.map(
        (option: any) => option.value,
      );
      expect(statusValues).toContain(TribThreadStatus.ACTIVE);
      expect(statusValues).toContain(TribThreadStatus.ARCHIVED);
      expect(statusValues).toContain(TribThreadStatus.BLOCKED);
      expect(statusValues).toContain(TribThreadStatus.CLOSED);
      expect(statusValues).toContain(TribThreadStatus.PAUSED);
    });

    it('should have correct type options', () => {
      const typeField = (TribThreadWorkspaceEntity as any).fieldMetadata.type;
      expect(typeField.options).toBeDefined();
      expect(typeField.options).toHaveLength(5);

      const typeValues = typeField.options.map((option: any) => option.value);
      expect(typeValues).toContain(TribThreadType.INDIVIDUAL);
      expect(typeValues).toContain(TribThreadType.GROUP);
      expect(typeValues).toContain(TribThreadType.BROADCAST);
      expect(typeValues).toContain(TribThreadType.SUPPORT);
      expect(typeValues).toContain(TribThreadType.MARKETING);
    });

    it('should have correct priority options', () => {
      const priorityField = (TribThreadWorkspaceEntity as any).fieldMetadata
        .priority;
      expect(priorityField.options).toBeDefined();
      expect(priorityField.options).toHaveLength(4);

      const priorityValues = priorityField.options.map(
        (option: any) => option.value,
      );
      expect(priorityValues).toContain(TribThreadPriority.LOW);
      expect(priorityValues).toContain(TribThreadPriority.NORMAL);
      expect(priorityValues).toContain(TribThreadPriority.HIGH);
      expect(priorityValues).toContain(TribThreadPriority.CRITICAL);
    });

    it('should have correct default values', () => {
      const statusField = (TribThreadWorkspaceEntity as any).fieldMetadata
        .status;
      expect(statusField.defaultValue).toBe(TribThreadStatus.ACTIVE);

      const typeField = (TribThreadWorkspaceEntity as any).fieldMetadata.type;
      expect(typeField.defaultValue).toBe(TribThreadType.INDIVIDUAL);

      const priorityField = (TribThreadWorkspaceEntity as any).fieldMetadata
        .priority;
      expect(priorityField.defaultValue).toBe(TribThreadPriority.NORMAL);

      const messageCountField = (TribThreadWorkspaceEntity as any).fieldMetadata
        .messageCount;
      expect(messageCountField.defaultValue).toBe(0);

      const archivedField = (TribThreadWorkspaceEntity as any).fieldMetadata
        .archived;
      expect(archivedField.defaultValue).toBe(false);

      const readStatusField = (TribThreadWorkspaceEntity as any).fieldMetadata
        .readStatus;
      expect(readStatusField.defaultValue).toBe(false);
    });
  });

  describe('Field Icons and Labels', () => {
    it('should have appropriate icons for all fields', () => {
      const fieldMetadata = (TribThreadWorkspaceEntity as any).fieldMetadata;

      expect(fieldMetadata.subject.icon).toBe('IconMessageCircle');
      expect(fieldMetadata.participants.icon).toBe('IconUsers');
      expect(fieldMetadata.status.icon).toBe('IconCheck');
      expect(fieldMetadata.type.icon).toBe('IconCategory');
      expect(fieldMetadata.priority.icon).toBe('IconFlag');
      expect(fieldMetadata.metadata.icon).toBe('IconCode');
      expect(fieldMetadata.lastMessageAt.icon).toBe('IconCalendar');
      expect(fieldMetadata.messageCount.icon).toBe('IconNumber');
      expect(fieldMetadata.tags.icon).toBe('IconTag');
      expect(fieldMetadata.archived.icon).toBe('IconArchive');
      expect(fieldMetadata.readStatus.icon).toBe('IconEye');
      expect(fieldMetadata.ownerId.icon).toBe('IconUser');
    });

    it('should have appropriate labels for all fields', () => {
      const fieldMetadata = (TribThreadWorkspaceEntity as any).fieldMetadata;

      expect(fieldMetadata.subject.label).toBe('Subject');
      expect(fieldMetadata.participants.label).toBe('Participants');
      expect(fieldMetadata.status.label).toBe('Status');
      expect(fieldMetadata.type.label).toBe('Type');
      expect(fieldMetadata.priority.label).toBe('Priority');
      expect(fieldMetadata.metadata.label).toBe('Metadata');
      expect(fieldMetadata.lastMessageAt.label).toBe('Last Message At');
      expect(fieldMetadata.messageCount.label).toBe('Message Count');
      expect(fieldMetadata.tags.label).toBe('Tags');
      expect(fieldMetadata.archived.label).toBe('Archived');
      expect(fieldMetadata.readStatus.label).toBe('Read Status');
      expect(fieldMetadata.ownerId.label).toBe('Owner');
    });
  });
});
