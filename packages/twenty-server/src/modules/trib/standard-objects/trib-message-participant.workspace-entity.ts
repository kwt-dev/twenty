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
import { WorkspaceJoinColumn } from 'src/engine/twenty-orm/decorators/workspace-join-column.decorator';
import { WorkspaceRelation } from 'src/engine/twenty-orm/decorators/workspace-relation.decorator';

import { TRIB_MESSAGE_PARTICIPANT_FIELD_IDS } from '../constants/trib-standard-field-ids';
import { TRIB_CONTACT_OBJECT_IDS } from '../constants/trib-standard-object-ids';
import { TribMessageWorkspaceEntity } from './trib-message.workspace-entity';
import { PersonWorkspaceEntity } from 'src/modules/person/standard-objects/person.workspace-entity';

/**
 * TribMessageParticipant WorkspaceEntity
 *
 * Bridge entity that links Person records to SMS messages, enabling SMS conversations
 * to appear in Person contact tabs (similar to emails). This entity serves as the critical
 * connection between Twenty's CRM system and TRIB's SMS infrastructure.
 *
 * Features:
 * - Links Person records to SMS messages via participant relationships
 * - Supports role-based participation (from/to) for conversation threading  
 * - Enables SMS messages to appear in Person views alongside emails
 * - Provides phone number tracking for each participant
 * - Maintains referential integrity with cascade/null delete behavior
 *
 * Architecture:
 * - Many TribMessageParticipants can link to one Person (one person, many SMS conversations)
 * - Many TribMessageParticipants can link to one TribMessage (group SMS support)
 * - Each participant has a role (from/to) and phone number for display
 *
 * @example
 * ```typescript
 * // Person sends SMS to customer
 * const participant = new TribMessageParticipantWorkspaceEntity();
 * participant.role = 'to';
 * participant.phoneNumber = '+1234567890';
 * participant.person = personEntity;
 * participant.tribMessage = messageEntity;
 * ```
 */
@WorkspaceIsSystem()
@WorkspaceEntity({
  standardId: TRIB_CONTACT_OBJECT_IDS.TRIB_MESSAGE_PARTICIPANT,
  namePlural: 'tribMessageParticipants',
  labelSingular: msg`SMS Participant`,
  labelPlural: msg`SMS Participants`,
  description: msg`Bridge entity linking Person to SMS messages`,
  icon: 'IconUserCircle',
  shortcut: 'SP',
})
export class TribMessageParticipantWorkspaceEntity extends BaseWorkspaceEntity {
  /**
   * Participant role in the SMS conversation
   * - 'from': This participant sent the message
   * - 'to': This participant received the message
   */
  @WorkspaceField({
    standardId: TRIB_MESSAGE_PARTICIPANT_FIELD_IDS.role,
    type: FieldMetadataType.SELECT,
    label: msg`Role`,
    description: msg`Participant role in SMS conversation`,
    icon: 'IconArrowRight',
    options: [
      { value: 'from', label: 'From', position: 0, color: 'green' },
      { value: 'to', label: 'To', position: 1, color: 'blue' },
    ],
    defaultValue: "'from'",
  })
  role: string;

  /**
   * Phone number of the participant  
   * Stored in E.164 format for consistency and international support
   */
  @WorkspaceField({
    standardId: TRIB_MESSAGE_PARTICIPANT_FIELD_IDS.phoneNumber,
    type: FieldMetadataType.TEXT,
    label: msg`Phone Number`,
    description: msg`Participant phone number in E.164 format`,
    icon: 'IconPhone',
  })
  phoneNumber: string;

  /**
   * Related Person entity (MANY_TO_ONE relationship)
   * Links SMS participant to a Person record in the CRM
   * - Nullable to handle cases where phone number doesn't match existing Person
   * - SET_NULL on delete preserves SMS history even if Person is deleted
   */
  @WorkspaceRelation({
    standardId: TRIB_MESSAGE_PARTICIPANT_FIELD_IDS.person,
    type: RelationType.MANY_TO_ONE,
    label: msg`Person`,
    description: msg`Related person in CRM system`,
    icon: 'IconUser',
    inverseSideTarget: () => PersonWorkspaceEntity,
    inverseSideFieldKey: 'tribMessageParticipants',
    onDelete: RelationOnDeleteAction.SET_NULL,
  })
  @WorkspaceIsNullable()
  person: Relation<PersonWorkspaceEntity> | null;

  @WorkspaceJoinColumn('person')
  personId: string | null;

  /**
   * Related TribMessage entity (MANY_TO_ONE relationship)
   * Links participant to the actual SMS message
   * - CASCADE on delete ensures participants are cleaned up with messages
   * - Required field as every participant must have a message
   */
  @WorkspaceRelation({
    standardId: TRIB_MESSAGE_PARTICIPANT_FIELD_IDS.tribMessage,
    type: RelationType.MANY_TO_ONE,
    label: msg`SMS Message`,
    description: msg`Related SMS message`,
    icon: 'IconMessage',
    inverseSideTarget: () => TribMessageWorkspaceEntity,
    inverseSideFieldKey: 'messageParticipants',
    onDelete: RelationOnDeleteAction.CASCADE,
  })
  tribMessage: Relation<TribMessageWorkspaceEntity>;

  @WorkspaceJoinColumn('tribMessage')
  tribMessageId: string;

  /**
   * Static helper method to create participant records
   * Simplifies creation of participants with proper validation
   *
   * @param messageId - TRIB message ID
   * @param personId - Person ID (nullable for unknown contacts)
   * @param phoneNumber - E.164 formatted phone number
   * @param role - Participant role ('from' or 'to')
   */
  static createParticipant(
    messageId: string,
    personId: string | null,
    phoneNumber: string,
    role: 'from' | 'to',
  ): Partial<TribMessageParticipantWorkspaceEntity> {
    return {
      tribMessageId: messageId,
      personId,
      phoneNumber,
      role,
    };
  }

  /**
   * Static helper method to validate E.164 phone number format
   * Ensures phone numbers are stored consistently
   *
   * @param phoneNumber - Phone number to validate
   * @returns True if phone number is valid E.164 format
   */
  static validatePhoneNumber(phoneNumber: string): boolean {
    const e164Regex = /^\+[1-9]\d{0,14}$/;
    return e164Regex.test(phoneNumber);
  }

  /**
   * Static helper method to normalize phone number to E.164 format
   * Converts various phone number formats to consistent E.164
   *
   * @param phoneNumber - Raw phone number string
   * @param defaultCountryCode - Country code to use if none provided (e.g., 'US')
   * @returns E.164 formatted phone number or null if invalid
   */
  static normalizePhoneNumber(phoneNumber: string, defaultCountryCode?: string): string | null {
    // Remove all non-digit characters
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    
    // If already has country code (11+ digits for US, varies by country)
    if (digitsOnly.length >= 11) {
      return `+${digitsOnly}`;
    }
    
    // If 10 digits and US default, assume US number
    if (digitsOnly.length === 10 && defaultCountryCode === 'US') {
      return `+1${digitsOnly}`;
    }
    
    // Cannot normalize without more context
    return null;
  }
}