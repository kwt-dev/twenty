import { CONSENT_FIELD_IDS } from '../constants/trib-standard-field-ids';
import { TRIB_CONSENT_OBJECT_IDS } from '../constants/trib-standard-object-ids';
import {
  ConsentStatus,
  ConsentSource,
  ConsentType,
  ConsentVerificationMethod,
  LegalBasis,
} from '../types/consent-enums';
import { validateConsentRecord } from '../utils/validation/consent-validator';

// Mock Twenty framework types for testing
export interface WorkspaceEntityMetadata {
  standardId: string;
  namePlural: string;
  labelSingular: string;
  labelPlural: string;
  description: string;
  icon: string;
  shortcut: string;
  labelIdentifierStandardId: string;
}

export interface WorkspaceFieldMetadata {
  standardId: string;
  type: string;
  label: string;
  description: string;
  icon: string;
  options?: Array<{ value: string; label: string; color: string }>;
  defaultValue?: any;
}

// Mock decorators for testing
export function WorkspaceEntity(metadata: WorkspaceEntityMetadata) {
  return function (target: any) {
    target.workspaceMetadata = metadata;
  };
}

export function WorkspaceField(metadata: WorkspaceFieldMetadata) {
  return function (target: any, propertyKey: string) {
    target.constructor.fieldMetadata = target.constructor.fieldMetadata || {};
    target.constructor.fieldMetadata[propertyKey] = metadata;
  };
}

export function WorkspaceIsNullable() {
  return function (target: any, propertyKey: string) {
    target.constructor.nullableFields = target.constructor.nullableFields || [];
    target.constructor.nullableFields.push(propertyKey);
  };
}

export function WorkspaceIsUnique() {
  return function (target: any, propertyKey: string) {
    target.constructor.uniqueFields = target.constructor.uniqueFields || [];
    target.constructor.uniqueFields.push(propertyKey);
  };
}

export function WorkspaceJoinColumn(field: string) {
  return function (target: any, propertyKey: string) {
    target.constructor.joinColumns = target.constructor.joinColumns || {};
    target.constructor.joinColumns[propertyKey] = field;
  };
}

export function WorkspaceRelation(metadata: any) {
  return function (target: any, propertyKey: string) {
    target.constructor.relationMetadata =
      target.constructor.relationMetadata || {};
    target.constructor.relationMetadata[propertyKey] = metadata;
  };
}

export class BaseWorkspaceEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface Relation<T> {
  id: string;
  entity: T;
}

/**
 * TribConsent WorkspaceEntity
 *
 * Core entity for TCPA compliance and consent management with comprehensive
 * tracking of opt-in/opt-out preferences, audit trails, and legal compliance.
 *
 * Features:
 * - TCPA compliance with status tracking (OPTED_IN, OPTED_OUT, PENDING)
 * - Audit trail with source tracking and metadata
 * - Date validation ensuring opt-out date >= opt-in date
 * - Phone number validation using TCPA-compliant formats
 * - Integration with Person entity for contact tracking
 * - Workspace isolation for multi-tenant architecture
 * - Legal basis tracking for GDPR compliance
 * - Verification method tracking for enhanced compliance
 *
 * @example
 * ```typescript
 * const consent = new TribConsentWorkspaceEntity();
 * consent.phoneNumber = "+1234567890";
 * consent.status = ConsentStatus.OPTED_IN;
 * consent.source = ConsentSource.WEB_FORM;
 * consent.optInDate = new Date();
 * consent.type = ConsentType.MARKETING;
 * consent.verificationMethod = ConsentVerificationMethod.EMAIL_DOUBLE_OPTIN;
 * ```
 */
@WorkspaceEntity({
  standardId: TRIB_CONSENT_OBJECT_IDS.TCPA_CONSENT,
  namePlural: 'tribConsents',
  labelSingular: 'TRIB Consent',
  labelPlural: 'TRIB Consents',
  description: 'TCPA consent record for messaging compliance',
  icon: 'IconShield',
  shortcut: 'C',
  labelIdentifierStandardId: CONSENT_FIELD_IDS.phoneNumber,
})
export class TribConsentWorkspaceEntity extends BaseWorkspaceEntity {
  /**
   * Phone number associated with consent
   * Must be in E.164 format for TCPA compliance
   */
  @WorkspaceField({
    standardId: CONSENT_FIELD_IDS.phoneNumber,
    type: 'TEXT',
    label: 'Phone Number',
    description: 'Phone number in E.164 format',
    icon: 'IconPhone',
  })
  phoneNumber: string;

  /**
   * Current consent status
   * Tracks opt-in/opt-out state for TCPA compliance
   */
  @WorkspaceField({
    standardId: CONSENT_FIELD_IDS.status,
    type: 'SELECT',
    label: 'Status',
    description: 'Current consent status',
    icon: 'IconCheck',
    options: [
      { value: ConsentStatus.OPTED_IN, label: 'Opted In', color: 'green' },
      { value: ConsentStatus.OPTED_OUT, label: 'Opted Out', color: 'red' },
      { value: ConsentStatus.PENDING, label: 'Pending', color: 'yellow' },
      { value: ConsentStatus.UNKNOWN, label: 'Unknown', color: 'gray' },
    ],
    defaultValue: ConsentStatus.UNKNOWN,
  })
  status: ConsentStatus;

  /**
   * Source of consent
   * Tracks how consent was obtained for audit trail
   */
  @WorkspaceField({
    standardId: CONSENT_FIELD_IDS.source,
    type: 'SELECT',
    label: 'Source',
    description: 'How consent was obtained',
    icon: 'IconSource',
    options: [
      { value: ConsentSource.WEB_FORM, label: 'Web Form', color: 'blue' },
      {
        value: ConsentSource.SMS_KEYWORD,
        label: 'SMS Keyword',
        color: 'green',
      },
      { value: ConsentSource.API, label: 'API', color: 'purple' },
      { value: ConsentSource.PHONE_CALL, label: 'Phone Call', color: 'orange' },
      { value: ConsentSource.EMAIL, label: 'Email', color: 'red' },
      { value: ConsentSource.MOBILE_APP, label: 'Mobile App', color: 'cyan' },
      { value: ConsentSource.INTEGRATION, label: 'Integration', color: 'pink' },
      { value: ConsentSource.MANUAL, label: 'Manual', color: 'gray' },
      { value: ConsentSource.UNKNOWN, label: 'Unknown', color: 'gray' },
    ],
    defaultValue: ConsentSource.UNKNOWN,
  })
  source: ConsentSource;

  /**
   * Type of consent
   * Defines what type of messages consent covers
   */
  @WorkspaceField({
    standardId: CONSENT_FIELD_IDS.type,
    type: 'SELECT',
    label: 'Type',
    description: 'Type of consent granted',
    icon: 'IconTag',
    options: [
      { value: ConsentType.MARKETING, label: 'Marketing', color: 'blue' },
      {
        value: ConsentType.TRANSACTIONAL,
        label: 'Transactional',
        color: 'green',
      },
      {
        value: ConsentType.INFORMATIONAL,
        label: 'Informational',
        color: 'yellow',
      },
      { value: ConsentType.EMERGENCY, label: 'Emergency', color: 'red' },
      { value: ConsentType.SERVICE, label: 'Service', color: 'purple' },
      { value: ConsentType.ALL, label: 'All', color: 'gray' },
    ],
    defaultValue: ConsentType.MARKETING,
  })
  @WorkspaceIsNullable()
  type: ConsentType | null;

  /**
   * Date when consent was granted
   * Required for OPTED_IN status
   */
  @WorkspaceField({
    standardId: CONSENT_FIELD_IDS.timestamp,
    type: 'DATE_TIME',
    label: 'Opt-In Date',
    description: 'Date when consent was granted',
    icon: 'IconCalendarCheck',
  })
  @WorkspaceIsNullable()
  optInDate: Date | null;

  /**
   * Date when consent was revoked
   * Required for OPTED_OUT status
   */
  @WorkspaceField({
    standardId: CONSENT_FIELD_IDS.expiryDate,
    type: 'DATE_TIME',
    label: 'Opt-Out Date',
    description: 'Date when consent was revoked',
    icon: 'IconCalendarX',
  })
  @WorkspaceIsNullable()
  optOutDate: Date | null;

  /**
   * Verification method used
   * Tracks how consent was verified for enhanced compliance
   */
  @WorkspaceField({
    standardId: CONSENT_FIELD_IDS.verified,
    type: 'SELECT',
    label: 'Verification Method',
    description: 'How consent was verified',
    icon: 'IconShieldCheck',
    options: [
      {
        value: ConsentVerificationMethod.EMAIL_DOUBLE_OPTIN,
        label: 'Email Double Opt-In',
        color: 'green',
      },
      {
        value: ConsentVerificationMethod.SMS_KEYWORD_CONFIRMATION,
        label: 'SMS Confirmation',
        color: 'blue',
      },
      {
        value: ConsentVerificationMethod.PHONE_VERIFICATION,
        label: 'Phone Verification',
        color: 'orange',
      },
      {
        value: ConsentVerificationMethod.MANUAL_VERIFICATION,
        label: 'Manual Verification',
        color: 'gray',
      },
      {
        value: ConsentVerificationMethod.API_VERIFICATION,
        label: 'API Verification',
        color: 'purple',
      },
      { value: ConsentVerificationMethod.NONE, label: 'None', color: 'gray' },
    ],
    defaultValue: ConsentVerificationMethod.NONE,
  })
  @WorkspaceIsNullable()
  verificationMethod: ConsentVerificationMethod | null;

  /**
   * Legal basis for processing
   * Required for GDPR compliance
   */
  @WorkspaceField({
    standardId: CONSENT_FIELD_IDS.legalBasis,
    type: 'SELECT',
    label: 'Legal Basis',
    description: 'Legal basis for processing consent data',
    icon: 'IconScale',
    options: [
      { value: LegalBasis.CONSENT, label: 'Consent', color: 'green' },
      { value: LegalBasis.CONTRACT, label: 'Contract', color: 'blue' },
      {
        value: LegalBasis.LEGAL_OBLIGATION,
        label: 'Legal Obligation',
        color: 'purple',
      },
      {
        value: LegalBasis.VITAL_INTERESTS,
        label: 'Vital Interests',
        color: 'red',
      },
      { value: LegalBasis.PUBLIC_TASK, label: 'Public Task', color: 'orange' },
      {
        value: LegalBasis.LEGITIMATE_INTERESTS,
        label: 'Legitimate Interests',
        color: 'cyan',
      },
    ],
    defaultValue: LegalBasis.CONSENT,
  })
  @WorkspaceIsNullable()
  legalBasis: LegalBasis | null;

  /**
   * Consent version/revision
   * Tracks changes to consent agreements
   */
  @WorkspaceField({
    standardId: CONSENT_FIELD_IDS.version,
    type: 'NUMBER',
    label: 'Version',
    description: 'Consent version/revision number',
    icon: 'IconVersions',
    defaultValue: 1,
  })
  version: number;

  /**
   * Verification status
   * Indicates if consent has been verified
   */
  @WorkspaceField({
    standardId: CONSENT_FIELD_IDS.verified,
    type: 'BOOLEAN',
    label: 'Verified',
    description: 'Whether consent has been verified',
    icon: 'IconShieldCheck',
    defaultValue: false,
  })
  verified: boolean;

  /**
   * Consent metadata
   * JSON field for additional compliance data (IP address, user agent, etc.)
   */
  @WorkspaceField({
    standardId: CONSENT_FIELD_IDS.metadata,
    type: 'RAW_JSON',
    label: 'Metadata',
    description: 'Additional consent metadata (IP, user agent, etc.)',
    icon: 'IconCode',
  })
  @WorkspaceIsNullable()
  metadata: Record<string, any> | null;

  /**
   * Audit trail
   * Complete history of consent changes
   */
  @WorkspaceField({
    standardId: CONSENT_FIELD_IDS.auditTrail,
    type: 'RAW_JSON',
    label: 'Audit Trail',
    description: 'Complete history of consent changes',
    icon: 'IconHistory',
  })
  @WorkspaceIsNullable()
  auditTrail: Array<{
    action: string;
    timestamp: Date;
    source: ConsentSource;
    metadata?: Record<string, any>;
  }> | null;

  // Relations

  /**
   * Related contact person ID
   * Links consent to a person in the CRM system
   */
  @WorkspaceField({
    standardId: CONSENT_FIELD_IDS.id,
    type: 'UUID',
    label: 'Contact ID',
    description: 'ID of the related contact person',
    icon: 'IconUser',
  })
  @WorkspaceIsNullable()
  contactId: string | null;

  /**
   * Contact person relationship
   * Links consent to a person entity
   * Note: PersonWorkspaceEntity would be defined in the main Twenty system
   */
  @WorkspaceRelation({
    relationType: 'MANY_TO_ONE',
    type: () => 'PersonWorkspaceEntity',
    inverseSideFieldKey: 'consents',
    onDelete: 'SET_NULL', // When person is deleted, consent contact is set to null
  })
  @WorkspaceJoinColumn('contactId')
  @WorkspaceIsNullable()
  contact: Relation<any> | null;

  /**
   * Validates consent record for TCPA compliance
   * @param record - Consent record to validate
   * @returns Validation result with errors and warnings
   */
  static validateConsent(record: Partial<TribConsentWorkspaceEntity>) {
    return validateConsentRecord({
      phoneNumber: record.phoneNumber || '',
      status: record.status || ConsentStatus.UNKNOWN,
      source: record.source || ConsentSource.UNKNOWN,
      type: record.type || undefined,
      verificationMethod: record.verificationMethod || undefined,
      legalBasis: record.legalBasis || undefined,
      optInDate: record.optInDate || undefined,
      optOutDate: record.optOutDate || undefined,
      metadata: record.metadata || undefined,
      contactId: record.contactId || undefined,
    });
  }

  /**
   * Validates phone number format for TCPA compliance
   * @param phoneNumber - Phone number to validate
   * @returns True if phone number is valid E.164 format
   */
  static validatePhoneNumber(phoneNumber: string): boolean {
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      return false;
    }

    // E.164 format validation
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phoneNumber);
  }

  /**
   * Validates consent status transition
   * @param fromStatus - Current status
   * @param toStatus - Target status
   * @returns True if transition is valid
   */
  static validateStatusTransition(
    fromStatus: ConsentStatus,
    toStatus: ConsentStatus,
  ): boolean {
    const validTransitions: Record<ConsentStatus, ConsentStatus[]> = {
      [ConsentStatus.UNKNOWN]: [
        ConsentStatus.PENDING,
        ConsentStatus.OPTED_IN,
        ConsentStatus.OPTED_OUT,
      ],
      [ConsentStatus.PENDING]: [
        ConsentStatus.OPTED_IN,
        ConsentStatus.OPTED_OUT,
      ],
      [ConsentStatus.OPTED_IN]: [ConsentStatus.OPTED_OUT],
      [ConsentStatus.OPTED_OUT]: [ConsentStatus.OPTED_IN], // Can opt back in
    };

    return validTransitions[fromStatus]?.includes(toStatus) ?? false;
  }

  /**
   * Validates consent dates for consistency
   * @param optInDate - Date consent was granted
   * @param optOutDate - Date consent was revoked
   * @returns True if dates are consistent
   */
  static validateConsentDates(
    optInDate: Date | null,
    optOutDate: Date | null,
  ): boolean {
    if (optInDate && optOutDate) {
      return optOutDate > optInDate;
    }
    return true;
  }

  /**
   * Checks if consent is expired based on opt-in date
   * @param optInDate - Date consent was granted
   * @param metadata - Consent metadata potentially containing expiry info
   * @returns True if consent is expired
   */
  static isConsentExpired(
    optInDate: Date | null,
    metadata?: Record<string, any>,
  ): boolean {
    if (!optInDate) {
      return false;
    }

    // Check for explicit expiry date in metadata
    if (metadata?.expiryDate) {
      const expiryDate = new Date(metadata.expiryDate);
      return expiryDate < new Date();
    }

    // Default expiry: 18 months for marketing consent (TCPA best practice)
    const eighteenMonthsAgo = new Date();
    eighteenMonthsAgo.setMonth(eighteenMonthsAgo.getMonth() - 18);

    return optInDate < eighteenMonthsAgo;
  }

  /**
   * Creates audit trail entry for consent changes
   * @param action - Action performed
   * @param source - Source of the change
   * @param metadata - Additional metadata
   * @returns Audit trail entry
   */
  static createAuditEntry(
    action: string,
    source: ConsentSource,
    metadata?: Record<string, any>,
  ) {
    return {
      action,
      timestamp: new Date(),
      source,
      metadata,
    };
  }

  /**
   * Checks if consent allows marketing messages
   * @param status - Current consent status
   * @param type - Consent type
   * @param optInDate - Date consent was granted
   * @returns True if marketing is allowed
   */
  static allowsMarketing(
    status: ConsentStatus,
    type: ConsentType | null,
    optInDate: Date | null,
  ): boolean {
    if (status !== ConsentStatus.OPTED_IN) {
      return false;
    }

    if (!type || (type !== ConsentType.MARKETING && type !== ConsentType.ALL)) {
      return false;
    }

    // Check if consent is expired
    return !this.isConsentExpired(optInDate);
  }

  /**
   * Checks if consent allows transactional messages
   * @param status - Current consent status
   * @param type - Consent type
   * @returns True if transactional is allowed
   */
  static allowsTransactional(
    status: ConsentStatus,
    type: ConsentType | null,
  ): boolean {
    if (status === ConsentStatus.OPTED_OUT) {
      return false;
    }

    // Transactional messages are generally allowed unless explicitly opted out
    return (
      type === ConsentType.TRANSACTIONAL ||
      type === ConsentType.ALL ||
      type === ConsentType.SERVICE
    );
  }
}
