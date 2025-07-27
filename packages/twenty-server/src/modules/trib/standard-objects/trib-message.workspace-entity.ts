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
import { WorkspaceIsUnique } from 'src/engine/twenty-orm/decorators/workspace-is-unique.decorator';
import { WorkspaceJoinColumn } from 'src/engine/twenty-orm/decorators/workspace-join-column.decorator';
import { WorkspaceRelation } from 'src/engine/twenty-orm/decorators/workspace-relation.decorator';

import { MESSAGE_FIELD_IDS } from '../constants/trib-standard-field-ids';
import { TRIB_MESSAGE_OBJECT_IDS } from '../constants/trib-standard-object-ids';
import {
  TribMessageStatus,
  TribMessageDirection,
  TribMessageChannel,
  TribMessagePriority,
  TribMessageEncoding,
} from '../types/message-enums';
import { TribThreadWorkspaceEntity } from './trib-thread.workspace-entity';
import { TribDeliveryWorkspaceEntity } from './trib-delivery.workspace-entity';
import { TribMessageParticipantWorkspaceEntity } from './trib-message-participant.workspace-entity';

/**
 * TribMessage WorkspaceEntity
 *
 * Core entity for TRIB messaging system with comprehensive field definitions
 * and type safety. Supports SMS, MMS, Email, WhatsApp, and Voice channels.
 *
 * Features:
 * - Enhanced status tracking with granular delivery states
 * - Idempotency protection via unique externalId constraint
 * - Comprehensive error tracking and retry logic
 * - Multi-channel support with channel-specific validation
 * - Workspace isolation for multi-tenant architecture
 *
 * @example
 * ```typescript
 * const message = new TribMessageWorkspaceEntity();
 * message.content = "Hello, World!";
 * message.channel = TribMessageChannel.SMS;
 * message.direction = TribMessageDirection.OUTBOUND;
 * message.from = "+1234567890";
 * message.to = "+0987654321";
 * message.status = TribMessageStatus.QUEUED;
 * ```
 */
@WorkspaceIsSystem()
@WorkspaceEntity({
  standardId: TRIB_MESSAGE_OBJECT_IDS.SMS_MESSAGE,
  namePlural: 'tribMessages',
  labelSingular: msg`TRIB Message`,
  labelPlural: msg`TRIB Messages`,
  description: msg`A message in the TRIB messaging system`,
  icon: 'IconMessage',
  shortcut: 'T',
  labelIdentifierStandardId: MESSAGE_FIELD_IDS.content,
})
export class TribMessageWorkspaceEntity extends BaseWorkspaceEntity {
  /**
   * Message content/body text
   * Core field containing the actual message content
   */
  @WorkspaceField({
    standardId: MESSAGE_FIELD_IDS.content,
    type: FieldMetadataType.TEXT,
    label: msg`Content`,
    description: msg`Message content/body text`,
    icon: 'IconMessage',
  })
  content: string;

  /**
   * Message status with enhanced granular tracking
   * Tracks message through complete delivery pipeline
   */
  @WorkspaceField({
    standardId: MESSAGE_FIELD_IDS.status,
    type: FieldMetadataType.SELECT,
    label: msg`Status`,
    description: msg`Message delivery status`,
    icon: 'IconCheck',
    options: [
      { value: TribMessageStatus.QUEUED, label: 'Queued', color: 'blue', position: 0 },
      { value: TribMessageStatus.SENDING, label: 'Sending', color: 'yellow', position: 1 },
      { value: TribMessageStatus.SENT, label: 'Sent', color: 'green', position: 2 },
      {
        value: TribMessageStatus.DELIVERED,
        label: 'Delivered',
        color: 'green',
        position: 3,
      },
      { value: TribMessageStatus.FAILED, label: 'Failed', color: 'red', position: 4 },
      {
        value: TribMessageStatus.UNDELIVERED,
        label: 'Undelivered',
        color: 'orange',
        position: 5,
      },
      { value: TribMessageStatus.CANCELED, label: 'Canceled', color: 'gray', position: 6 },
    ],
    defaultValue: `'${TribMessageStatus.QUEUED}'`,
  })
  status: TribMessageStatus;

  /**
   * Message channel/type
   * Supports multiple communication channels
   */
  @WorkspaceField({
    standardId: MESSAGE_FIELD_IDS.type,
    type: FieldMetadataType.SELECT,
    label: msg`Channel`,
    description: msg`Message channel (SMS, MMS, Email, etc.)`,
    icon: 'IconPhone',
    options: [
      { value: TribMessageChannel.SMS, label: 'SMS', color: 'blue', position: 0 },
      { value: TribMessageChannel.MMS, label: 'MMS', color: 'purple', position: 1 },
      { value: TribMessageChannel.EMAIL, label: 'Email', color: 'red', position: 2 },
      { value: TribMessageChannel.WHATSAPP, label: 'WhatsApp', color: 'green', position: 3 },
      { value: TribMessageChannel.VOICE, label: 'Voice', color: 'orange', position: 4 },
    ],
    defaultValue: `'${TribMessageChannel.SMS}'`,
  })
  channel: TribMessageChannel;

  /**
   * Message direction
   * Tracks whether message is inbound or outbound
   */
  @WorkspaceField({
    standardId: MESSAGE_FIELD_IDS.direction,
    type: FieldMetadataType.SELECT,
    label: msg`Direction`,
    description: msg`Message direction (inbound/outbound)`,
    icon: 'IconArrowRight',
    options: [
      {
        value: TribMessageDirection.OUTBOUND,
        label: 'Outbound',
        color: 'blue',
        position: 0,
      },
      { value: TribMessageDirection.INBOUND, label: 'Inbound', color: 'green', position: 1 },
    ],
    defaultValue: `'${TribMessageDirection.OUTBOUND}'`,
  })
  direction: TribMessageDirection;

  /**
   * Sender identifier
   * Phone number, email address, or other identifier based on channel
   */
  @WorkspaceField({
    standardId: MESSAGE_FIELD_IDS.from,
    type: FieldMetadataType.TEXT,
    label: msg`From`,
    description: msg`Sender identifier (phone/email/etc.)`,
    icon: 'IconUser',
  })
  from: string;

  /**
   * Recipient identifier
   * Phone number, email address, or other identifier based on channel
   */
  @WorkspaceField({
    standardId: MESSAGE_FIELD_IDS.to,
    type: FieldMetadataType.TEXT,
    label: msg`To`,
    description: msg`Recipient identifier (phone/email/etc.)`,
    icon: 'IconUserPlus',
  })
  to: string;

  /**
   * Message timestamp
   * When the message was sent/scheduled
   */
  @WorkspaceField({
    standardId: MESSAGE_FIELD_IDS.timestamp,
    type: FieldMetadataType.DATE_TIME,
    label: msg`Timestamp`,
    description: msg`Message timestamp`,
    icon: 'IconCalendar',
  })
  @WorkspaceIsNullable()
  timestamp: Date | null;

  /**
   * External provider message ID
   * Critical for idempotency and webhook processing
   */
  @WorkspaceField({
    standardId: MESSAGE_FIELD_IDS.externalId,
    type: FieldMetadataType.TEXT,
    label: msg`External ID`,
    description: msg`External provider ID (e.g., Twilio SID)`,
    icon: 'IconExternalLink',
  })
  @WorkspaceIsNullable()
  @WorkspaceIsUnique() // CRITICAL: Prevents duplicate webhook processing
  externalId: string | null;

  /**
   * Message priority level
   * Controls processing priority in message queue
   */
  @WorkspaceField({
    standardId: MESSAGE_FIELD_IDS.priority,
    type: FieldMetadataType.SELECT,
    label: msg`Priority`,
    description: msg`Message priority level`,
    icon: 'IconFlag',
    options: [
      { value: TribMessagePriority.LOW, label: 'Low', color: 'gray', position: 0 },
      { value: TribMessagePriority.NORMAL, label: 'Normal', color: 'blue', position: 1 },
      { value: TribMessagePriority.HIGH, label: 'High', color: 'orange', position: 2 },
      { value: TribMessagePriority.CRITICAL, label: 'Critical', color: 'red', position: 3 },
    ],
    defaultValue: `'${TribMessagePriority.NORMAL}'`,
  })
  priority: TribMessagePriority;

  /**
   * Message metadata
   * JSON field for additional message-specific data
   */
  @WorkspaceField({
    standardId: MESSAGE_FIELD_IDS.metadata,
    type: FieldMetadataType.RAW_JSON,
    label: msg`Metadata`,
    description: msg`Message metadata (JSON)`,
    icon: 'IconCode',
  })
  @WorkspaceIsNullable()
  metadata: Record<string, any> | null;

  /**
   * Error code for enhanced error tracking
   * Provider-specific error codes for failed messages
   */
  @WorkspaceField({
    standardId: MESSAGE_FIELD_IDS.errorCode,
    type: FieldMetadataType.TEXT,
    label: msg`Error Code`,
    description: msg`Provider error code for failed messages`,
    icon: 'IconAlertTriangle',
  })
  @WorkspaceIsNullable()
  errorCode: string | null;

  /**
   * Error message for enhanced error tracking
   * Human-readable error description for failed messages
   */
  @WorkspaceField({
    standardId: MESSAGE_FIELD_IDS.errorMessage,
    type: FieldMetadataType.TEXT,
    label: msg`Error Message`,
    description: msg`Detailed error message for failed deliveries`,
    icon: 'IconAlertTriangle',
  })
  @WorkspaceIsNullable()
  errorMessage: string | null;

  /**
   * Retry count for failed messages
   * Tracks number of delivery attempts
   */
  @WorkspaceField({
    standardId: MESSAGE_FIELD_IDS.retryCount,
    type: FieldMetadataType.NUMBER,
    label: msg`Retry Count`,
    description: msg`Number of delivery attempts`,
    icon: 'IconRefresh',
    defaultValue: 0,
  })
  retryCount: number;

  /**
   * Message size in bytes
   * Important for billing and performance monitoring
   */
  @WorkspaceField({
    standardId: MESSAGE_FIELD_IDS.messageSize,
    type: FieldMetadataType.NUMBER,
    label: msg`Message Size`,
    description: msg`Message size in bytes`,
    icon: 'IconFileSize',
  })
  @WorkspaceIsNullable()
  messageSize: number | null;

  /**
   * Message encoding type
   * Character encoding used for message content
   */
  @WorkspaceField({
    standardId: MESSAGE_FIELD_IDS.encoding,
    type: FieldMetadataType.SELECT,
    label: msg`Encoding`,
    description: msg`Message character encoding`,
    icon: 'IconCode',
    options: [
      { value: TribMessageEncoding.UTF8, label: 'UTF8', color: 'blue', position: 0 },
      { value: TribMessageEncoding.ASCII, label: 'ASCII', color: 'gray', position: 1 },
      { value: TribMessageEncoding.UCS2, label: 'UCS2', color: 'purple', position: 2 },
      { value: TribMessageEncoding.LATIN1, label: 'LATIN1', color: 'green', position: 3 },
    ],
    defaultValue: `'${TribMessageEncoding.UTF8}'`,
  })
  encoding: TribMessageEncoding;

  // Relations

  /**
   * Related contact person ID
   * Links message to a person in the CRM system
   */
  @WorkspaceField({
    standardId: MESSAGE_FIELD_IDS.contact,
    type: FieldMetadataType.UUID,
    label: msg`Contact ID`,
    description: msg`ID of the related contact person`,
    icon: 'IconUser',
  })
  @WorkspaceIsNullable()
  contactPersonId: string | null;

  /**
   * Message thread relationship
   * Links message to a conversation thread
   * MANY_TO_ONE relationship with TribThread
   */
  @WorkspaceRelation({
    standardId: MESSAGE_FIELD_IDS.threadId,
    type: RelationType.MANY_TO_ONE,
    label: msg`Thread`,
    description: msg`Conversation thread this message belongs to`,
    icon: 'IconMessageCircle',
    inverseSideTarget: () => TribThreadWorkspaceEntity,
    inverseSideFieldKey: 'messages',
    onDelete: RelationOnDeleteAction.SET_NULL,
  })
  @WorkspaceIsNullable()
  thread: Relation<any> | null;

  @WorkspaceJoinColumn('thread')
  threadId: string | null;

  /**
   * Delivery tracking relationship
   * ONE_TO_MANY relationship with TribDelivery (a message can have multiple delivery attempts)
   * Links message to delivery tracking records
   */
  @WorkspaceRelation({
    standardId: MESSAGE_FIELD_IDS.deliveryId,
    type: RelationType.ONE_TO_MANY,
    label: msg`Deliveries`,
    description: msg`Delivery tracking records for this message`,
    icon: 'IconTruck',
    inverseSideTarget: () => TribDeliveryWorkspaceEntity,
    inverseSideFieldKey: 'message',
    onDelete: RelationOnDeleteAction.SET_NULL,
  })
  @WorkspaceIsNullable()
  deliveries: Relation<any>[] | null;

  /**
   * Message participants relationship
   * ONE_TO_MANY relationship with TribMessageParticipant
   * Links message to participant records (who sent/received the message)
   * Enables SMS messages to appear in Person contact tabs
   */
  @WorkspaceRelation({
    standardId: MESSAGE_FIELD_IDS.messageParticipants,
    type: RelationType.ONE_TO_MANY,
    label: msg`Message Participants`,
    description: msg`SMS participants for this message`,
    icon: 'IconUserCircle',
    inverseSideTarget: () => TribMessageParticipantWorkspaceEntity,
    inverseSideFieldKey: 'tribMessage',
    onDelete: RelationOnDeleteAction.CASCADE,
  })
  messageParticipants: Relation<TribMessageParticipantWorkspaceEntity[]>;

  /**
   * Validates message content based on channel
   * @param content - Message content to validate
   * @param channel - Message channel type
   * @returns True if content is valid for the channel
   */
  static validateContent(
    content: string,
    channel: TribMessageChannel,
  ): boolean {
    if (!content || content.trim().length === 0) {
      return false;
    }

    switch (channel) {
      case TribMessageChannel.SMS:
        return content.length <= 1600; // SMS max length
      case TribMessageChannel.MMS:
        return content.length <= 10000; // MMS max length
      case TribMessageChannel.EMAIL:
        return content.length <= 100000; // Email max length
      case TribMessageChannel.WHATSAPP:
        return content.length <= 4096; // WhatsApp max length
      case TribMessageChannel.VOICE:
        return content.length <= 1000; // Voice script max length
      default:
        return false;
    }
  }

  /**
   * Validates phone number format (E.164)
   * @param phoneNumber - Phone number to validate
   * @returns True if phone number is valid E.164 format
   */
  static validatePhoneNumber(phoneNumber: string): boolean {
    const e164Regex = /^\+[1-9]\d{0,14}$/;
    return e164Regex.test(phoneNumber);
  }

  /**
   * Validates email address format
   * @param email - Email address to validate
   * @returns True if email is valid format
   */
  static validateEmailAddress(email: string): boolean {
    const emailRegex = /^[^\s@]+(?:\.[^\s@]+)*@[^\s@]+(?:\.[^\s@]+)+$/;
    return !email.includes('..') && emailRegex.test(email);
  }

  /**
   * Checks if message is in a terminal state
   * @param status - Message status to check
   * @returns True if status is terminal (delivered, failed, canceled)
   */
  static isTerminalStatus(status: TribMessageStatus): boolean {
    return [TribMessageStatus.DELIVERED, TribMessageStatus.CANCELED].includes(
      status,
    );
  }

  /**
   * Checks if message can be retried
   * @param status - Message status to check
   * @returns True if message can be retried
   */
  static canRetry(status: TribMessageStatus): boolean {
    return [TribMessageStatus.FAILED, TribMessageStatus.UNDELIVERED].includes(
      status,
    );
  }
}
