import { THREAD_FIELD_IDS } from '../constants/trib-standard-field-ids';
import { TRIB_CONTACT_OBJECT_IDS } from '../constants/trib-standard-object-ids';
import {
  TribThreadStatus,
  TribThreadType,
  TribThreadPriority,
} from '../types/thread-enums';
import { TribMessageWorkspaceEntity } from './trib-message.workspace-entity';

// Import mock Twenty framework types from TribMessage (consistent with existing pattern)
import {
  WorkspaceEntity,
  WorkspaceField,
  WorkspaceIsNullable,
  WorkspaceRelation,
  WorkspaceJoinColumn,
  BaseWorkspaceEntity,
  Relation,
} from './trib-message.workspace-entity';

/**
 * TribThread WorkspaceEntity
 *
 * Core entity for TRIB conversation thread management with comprehensive field definitions
 * and relationship handling. Manages conversation threads across multiple channels.
 *
 * Features:
 * - Thread lifecycle management with status tracking
 * - ONE_TO_MANY relationship with TribMessage entities
 * - MANY_TO_ONE relationship with Person (contact) entities
 * - Thread participant management and opt-out tracking
 * - Message count and timestamp management
 * - Workspace isolation for multi-tenant architecture
 *
 * Relationships:
 * - One thread can have many messages (ONE_TO_MANY)
 * - One thread belongs to one primary contact (MANY_TO_ONE)
 * - Thread supports multiple participants via JSON array field
 *
 * @example
 * ```typescript
 * const thread = new TribThreadWorkspaceEntity();
 * thread.subject = "Customer Support - Product Question";
 * thread.status = TribThreadStatus.ACTIVE;
 * thread.type = TribThreadType.SUPPORT;
 * thread.participants = ["+1234567890", "+0987654321"];
 * thread.messageCount = 5;
 * thread.lastMessageAt = new Date();
 * ```
 */
@WorkspaceEntity({
  standardId: TRIB_CONTACT_OBJECT_IDS.CONTACT_THREAD, // Using thread object ID
  namePlural: 'tribThreads',
  labelSingular: 'TRIB Thread',
  labelPlural: 'TRIB Threads',
  description: 'A conversation thread in the TRIB messaging system',
  icon: 'IconMessageCircle',
  shortcut: 'H',
  labelIdentifierStandardId: THREAD_FIELD_IDS.subject,
})
export class TribThreadWorkspaceEntity extends BaseWorkspaceEntity {
  /**
   * Thread subject/title
   * Human-readable identifier for the conversation
   */
  @WorkspaceField({
    standardId: THREAD_FIELD_IDS.subject,
    type: 'TEXT',
    label: 'Subject',
    description: 'Thread subject/title',
    icon: 'IconMessageCircle',
  })
  @WorkspaceIsNullable()
  subject: string | null;

  /**
   * Thread participants
   * JSON array of participant identifiers (phone numbers, email addresses, etc.)
   */
  @WorkspaceField({
    standardId: THREAD_FIELD_IDS.participants,
    type: 'RAW_JSON',
    label: 'Participants',
    description: 'Thread participants (JSON array)',
    icon: 'IconUsers',
  })
  participants: string[];

  /**
   * Thread status
   * Current lifecycle state of the conversation
   */
  @WorkspaceField({
    standardId: THREAD_FIELD_IDS.status,
    type: 'SELECT',
    label: 'Status',
    description: 'Thread status (active, archived, blocked, etc.)',
    icon: 'IconCheck',
    options: [
      { value: TribThreadStatus.ACTIVE, label: 'Active', color: 'green' },
      { value: TribThreadStatus.ARCHIVED, label: 'Archived', color: 'gray' },
      { value: TribThreadStatus.BLOCKED, label: 'Blocked', color: 'red' },
      { value: TribThreadStatus.CLOSED, label: 'Closed', color: 'blue' },
      { value: TribThreadStatus.PAUSED, label: 'Paused', color: 'yellow' },
    ],
    defaultValue: TribThreadStatus.ACTIVE,
  })
  status: TribThreadStatus;

  /**
   * Thread type
   * Categorizes the type of conversation
   */
  @WorkspaceField({
    standardId: THREAD_FIELD_IDS.type,
    type: 'SELECT',
    label: 'Type',
    description: 'Thread type (individual, group, support, etc.)',
    icon: 'IconCategory',
    options: [
      { value: TribThreadType.INDIVIDUAL, label: 'Individual', color: 'blue' },
      { value: TribThreadType.GROUP, label: 'Group', color: 'purple' },
      { value: TribThreadType.BROADCAST, label: 'Broadcast', color: 'orange' },
      { value: TribThreadType.SUPPORT, label: 'Support', color: 'green' },
      { value: TribThreadType.MARKETING, label: 'Marketing', color: 'red' },
    ],
    defaultValue: TribThreadType.INDIVIDUAL,
  })
  type: TribThreadType;

  /**
   * Thread priority level
   * Controls processing priority and urgency
   */
  @WorkspaceField({
    standardId: THREAD_FIELD_IDS.priority,
    type: 'SELECT',
    label: 'Priority',
    description: 'Thread priority level',
    icon: 'IconFlag',
    options: [
      { value: TribThreadPriority.LOW, label: 'Low', color: 'gray' },
      { value: TribThreadPriority.NORMAL, label: 'Normal', color: 'blue' },
      { value: TribThreadPriority.HIGH, label: 'High', color: 'orange' },
      { value: TribThreadPriority.CRITICAL, label: 'Critical', color: 'red' },
    ],
    defaultValue: TribThreadPriority.NORMAL,
  })
  priority: TribThreadPriority;

  /**
   * Thread metadata
   * JSON field for additional thread-specific data
   */
  @WorkspaceField({
    standardId: THREAD_FIELD_IDS.metadata,
    type: 'RAW_JSON',
    label: 'Metadata',
    description: 'Thread metadata (JSON)',
    icon: 'IconCode',
  })
  @WorkspaceIsNullable()
  metadata: Record<string, any> | null;

  /**
   * Last message timestamp
   * Tracks when the most recent message was sent/received
   */
  @WorkspaceField({
    standardId: THREAD_FIELD_IDS.lastMessageAt,
    type: 'DATE_TIME',
    label: 'Last Message At',
    description: 'Timestamp of the last message in thread',
    icon: 'IconCalendar',
  })
  @WorkspaceIsNullable()
  lastMessageAt: Date | null;

  /**
   * Total message count
   * Tracks the total number of messages in the thread
   */
  @WorkspaceField({
    standardId: THREAD_FIELD_IDS.messageCount,
    type: 'NUMBER',
    label: 'Message Count',
    description: 'Total number of messages in thread',
    icon: 'IconNumber',
    defaultValue: 0,
  })
  messageCount: number;

  /**
   * Thread tags
   * JSON array of tags for categorization and filtering
   */
  @WorkspaceField({
    standardId: THREAD_FIELD_IDS.tags,
    type: 'RAW_JSON',
    label: 'Tags',
    description: 'Thread tags (JSON array)',
    icon: 'IconTag',
  })
  @WorkspaceIsNullable()
  tags: string[] | null;

  /**
   * Thread archived status
   * Boolean flag indicating if thread is archived
   */
  @WorkspaceField({
    standardId: THREAD_FIELD_IDS.archived,
    type: 'BOOLEAN',
    label: 'Archived',
    description: 'Whether thread is archived',
    icon: 'IconArchive',
    defaultValue: false,
  })
  archived: boolean;

  /**
   * Thread read status
   * Boolean flag indicating if thread has been read
   */
  @WorkspaceField({
    standardId: THREAD_FIELD_IDS.readStatus,
    type: 'BOOLEAN',
    label: 'Read Status',
    description: 'Whether thread has been read',
    icon: 'IconEye',
    defaultValue: false,
  })
  readStatus: boolean;

  /**
   * Thread owner/creator
   * ID of the user who created or owns the thread
   */
  @WorkspaceField({
    standardId: THREAD_FIELD_IDS.owner,
    type: 'UUID',
    label: 'Owner',
    description: 'Thread owner/creator ID',
    icon: 'IconUser',
  })
  @WorkspaceIsNullable()
  ownerId: string | null;

  // Relationships

  /**
   * ONE_TO_MANY relationship with TribMessage entities
   * One thread can have many messages
   */
  @WorkspaceRelation({
    relationType: 'ONE_TO_MANY',
    type: () => TribMessageWorkspaceEntity,
    inverseSideFieldKey: 'thread',
    onDelete: 'CASCADE', // When thread is deleted, all messages are deleted
  })
  messages: Relation<TribMessageWorkspaceEntity>[];

  /**
   * MANY_TO_ONE relationship with Person (contact) entities
   * Many threads can belong to one contact
   */
  @WorkspaceField({
    standardId: THREAD_FIELD_IDS.id, // Using thread ID for the relationship
    type: 'RELATION',
    label: 'Contact',
    description: 'Primary contact for this thread',
    icon: 'IconUser',
  })
  @WorkspaceRelation({
    relationType: 'MANY_TO_ONE',
    type: () => 'Person', // Reference to Twenty's Person entity
    inverseSideFieldKey: 'tribThreads',
    onDelete: 'SET_NULL', // When contact is deleted, thread contact is set to null
  })
  @WorkspaceJoinColumn('contactId')
  @WorkspaceIsNullable()
  contact: Relation<any> | null;

  /**
   * Contact ID for the primary contact
   * Foreign key to the Person entity
   */
  @WorkspaceField({
    standardId: THREAD_FIELD_IDS.id,
    type: 'UUID',
    label: 'Contact ID',
    description: 'ID of the primary contact',
    icon: 'IconUser',
  })
  @WorkspaceIsNullable()
  contactId: string | null;

  /**
   * Validates thread participants array
   * @param participants - Participants array to validate
   * @returns True if participants array is valid
   */
  static validateParticipants(participants: string[]): boolean {
    if (!Array.isArray(participants)) {
      return false;
    }

    // Thread must have at least 1 participant and no more than 100
    if (participants.length < 1 || participants.length > 100) {
      return false;
    }

    // All participants must be valid identifiers
    return participants.every(
      (participant) =>
        typeof participant === 'string' &&
        participant.trim().length > 0 &&
        participant.length <= 50,
    );
  }

  /**
   * Validates thread subject
   * @param subject - Subject string to validate
   * @returns True if subject is valid
   */
  static validateSubject(subject: string | null): boolean {
    if (subject === null || subject === undefined) {
      return true; // Subject is optional
    }

    if (typeof subject !== 'string') {
      return false;
    }

    const trimmedSubject = subject.trim();
    return trimmedSubject.length > 0 && trimmedSubject.length <= 200;
  }

  /**
   * Checks if thread can receive new messages
   * @param status - Thread status to check
   * @returns True if thread can receive messages
   */
  static canReceiveMessages(status: TribThreadStatus): boolean {
    return status === TribThreadStatus.ACTIVE;
  }

  /**
   * Checks if thread is in a terminal state
   * @param status - Thread status to check
   * @returns True if thread is in terminal state
   */
  static isTerminalStatus(status: TribThreadStatus): boolean {
    return status === TribThreadStatus.CLOSED;
  }

  /**
   * Increments message count
   * Helper method for updating message count when new messages are added
   */
  incrementMessageCount(): void {
    this.messageCount = (this.messageCount || 0) + 1;
    this.lastMessageAt = new Date();
  }

  /**
   * Decrements message count
   * Helper method for updating message count when messages are deleted
   */
  decrementMessageCount(): void {
    this.messageCount = Math.max(0, (this.messageCount || 0) - 1);
  }

  /**
   * Updates last message timestamp
   * Helper method for updating the last message timestamp
   */
  updateLastMessageAt(timestamp: Date): void {
    this.lastMessageAt = timestamp;
  }

  /**
   * Checks if a participant is opted out
   * @param participant - Participant identifier to check
   * @returns True if participant is opted out
   */
  isParticipantOptedOut(participant: string): boolean {
    // This would typically check against a consent/opt-out system
    // For now, returning false as a placeholder
    return false;
  }

  /**
   * Adds a participant to the thread
   * @param participant - Participant identifier to add
   * @returns True if participant was added successfully
   */
  addParticipant(participant: string): boolean {
    if (!participant || typeof participant !== 'string') {
      return false;
    }

    if (this.participants.includes(participant)) {
      return false; // Already exists
    }

    if (this.participants.length >= 100) {
      return false; // Too many participants
    }

    this.participants.push(participant);
    return true;
  }

  /**
   * Removes a participant from the thread
   * @param participant - Participant identifier to remove
   * @returns True if participant was removed successfully
   */
  removeParticipant(participant: string): boolean {
    const index = this.participants.indexOf(participant);
    if (index === -1) {
      return false; // Not found
    }

    this.participants.splice(index, 1);
    return true;
  }
}
