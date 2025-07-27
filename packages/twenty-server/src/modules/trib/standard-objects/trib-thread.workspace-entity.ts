import { msg } from '@lingui/core/macro';
import { FieldMetadataType } from 'twenty-shared/types';

import { RelationOnDeleteAction } from 'src/engine/metadata-modules/field-metadata/interfaces/relation-on-delete-action.interface';
import { RelationType } from 'src/engine/metadata-modules/field-metadata/interfaces/relation-type.interface';
import { Relation } from 'src/engine/workspace-manager/workspace-sync-metadata/interfaces/relation.interface';

import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';
import { WorkspaceEntity } from 'src/engine/twenty-orm/decorators/workspace-entity.decorator';
import { WorkspaceField } from 'src/engine/twenty-orm/decorators/workspace-field.decorator';
import { WorkspaceIsNullable } from 'src/engine/twenty-orm/decorators/workspace-is-nullable.decorator';
import { WorkspaceIsSystem } from 'src/engine/twenty-orm/decorators/workspace-is-system.decorator';
import { WorkspaceRelation } from 'src/engine/twenty-orm/decorators/workspace-relation.decorator';

import { THREAD_FIELD_IDS } from '../constants/trib-standard-field-ids';
import { TRIB_MESSAGE_OBJECT_IDS } from '../constants/trib-standard-object-ids';
import {
  TribThreadStatus,
  TribThreadType,
  TribThreadPriority,
} from '../types/thread-enums';
import { TribMessageWorkspaceEntity } from './trib-message.workspace-entity';

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
@WorkspaceIsSystem()
@WorkspaceEntity({
  standardId: TRIB_MESSAGE_OBJECT_IDS.MESSAGE_THREAD, // Using message thread object ID
  namePlural: 'tribThreads',
  labelSingular: msg`TRIB Thread`,
  labelPlural: msg`TRIB Threads`,
  description: msg`A conversation thread in the TRIB messaging system`,
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
    type: FieldMetadataType.TEXT,
    label: msg`Subject`,
    description: msg`Thread subject/title`,
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
    type: FieldMetadataType.RAW_JSON,
    label: msg`Participants`,
    description: msg`Thread participants (JSON array)`,
    icon: 'IconUsers',
  })
  participants: string[];

  /**
   * Thread status
   * Current lifecycle state of the conversation
   */
  @WorkspaceField({
    standardId: THREAD_FIELD_IDS.status,
    type: FieldMetadataType.SELECT,
    label: msg`Status`,
    description: msg`Thread status (active, archived, blocked, etc.)`,
    icon: 'IconCheck',
    options: [
      { value: TribThreadStatus.ACTIVE, label: 'Active', color: 'green', position: 0 },
      { value: TribThreadStatus.ARCHIVED, label: 'Archived', color: 'gray', position: 1 },
      { value: TribThreadStatus.BLOCKED, label: 'Blocked', color: 'red', position: 2 },
      { value: TribThreadStatus.CLOSED, label: 'Closed', color: 'blue', position: 3 },
      { value: TribThreadStatus.PAUSED, label: 'Paused', color: 'yellow', position: 4 },
    ],
    defaultValue: `'${TribThreadStatus.ACTIVE}'`,
  })
  status: TribThreadStatus;

  /**
   * Thread type
   * Categorizes the type of conversation
   */
  @WorkspaceField({
    standardId: THREAD_FIELD_IDS.type,
    type: FieldMetadataType.SELECT,
    label: msg`Type`,
    description: msg`Thread type (individual, group, support, etc.)`,
    icon: 'IconCategory',
    options: [
      { value: TribThreadType.INDIVIDUAL, label: 'Individual', color: 'blue', position: 0 },
      { value: TribThreadType.GROUP, label: 'Group', color: 'purple', position: 1 },
      { value: TribThreadType.BROADCAST, label: 'Broadcast', color: 'orange', position: 2 },
      { value: TribThreadType.SUPPORT, label: 'Support', color: 'green', position: 3 },
      { value: TribThreadType.MARKETING, label: 'Marketing', color: 'red', position: 4 },
    ],
    defaultValue: `'${TribThreadType.INDIVIDUAL}'`,
  })
  type: TribThreadType;

  /**
   * Thread priority level
   * Controls processing priority and urgency
   */
  @WorkspaceField({
    standardId: THREAD_FIELD_IDS.priority,
    type: FieldMetadataType.SELECT,
    label: msg`Priority`,
    description: msg`Thread priority level`,
    icon: 'IconFlag',
    options: [
      { value: TribThreadPriority.LOW, label: 'Low', color: 'gray', position: 0 },
      { value: TribThreadPriority.NORMAL, label: 'Normal', color: 'blue', position: 1 },
      { value: TribThreadPriority.HIGH, label: 'High', color: 'orange', position: 2 },
      { value: TribThreadPriority.CRITICAL, label: 'Critical', color: 'red', position: 3 },
    ],
    defaultValue: `'${TribThreadPriority.NORMAL}'`,
  })
  priority: TribThreadPriority;

  /**
   * Thread metadata
   * JSON field for additional thread-specific data
   */
  @WorkspaceField({
    standardId: THREAD_FIELD_IDS.metadata,
    type: FieldMetadataType.RAW_JSON,
    label: msg`Metadata`,
    description: msg`Thread metadata (JSON)`,
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
    type: FieldMetadataType.DATE_TIME,
    label: msg`Last Message At`,
    description: msg`Timestamp of the last message in thread`,
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
    type: FieldMetadataType.NUMBER,
    label: msg`Message Count`,
    description: msg`Total number of messages in thread`,
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
    type: FieldMetadataType.RAW_JSON,
    label: msg`Tags`,
    description: msg`Thread tags (JSON array)`,
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
    type: FieldMetadataType.BOOLEAN,
    label: msg`Archived`,
    description: msg`Whether thread is archived`,
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
    type: FieldMetadataType.BOOLEAN,
    label: msg`Read Status`,
    description: msg`Whether thread has been read`,
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
    type: FieldMetadataType.UUID,
    label: msg`Owner`,
    description: msg`Thread owner/creator ID`,
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
    standardId: THREAD_FIELD_IDS.messages,
    type: RelationType.ONE_TO_MANY,
    label: msg`Messages`,
    description: msg`Messages in this thread`,
    icon: 'IconMessage',
    inverseSideTarget: () => TribMessageWorkspaceEntity,
    inverseSideFieldKey: 'thread',
    onDelete: RelationOnDeleteAction.CASCADE,
  })
  messages: Relation<TribMessageWorkspaceEntity>[];

  /**
   * Contact ID for the primary contact
   * Simple UUID reference to Person entity (loose coupling)
   */
  @WorkspaceField({
    standardId: THREAD_FIELD_IDS.primaryContactId,
    type: FieldMetadataType.UUID,
    label: msg`Contact ID`,
    description: msg`ID of the primary contact`,
    icon: 'IconUser',
  })
  @WorkspaceIsNullable()
  primaryContactId: string | null;

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
