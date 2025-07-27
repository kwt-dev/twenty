import { PHONE_NUMBER_FIELD_IDS } from '../constants/trib-standard-field-ids';
import { TRIB_PHONE_NUMBER_OBJECT_IDS } from '../constants/trib-standard-object-ids';
import {
  validateProviderCapabilities,
  isValidProvider,
} from '../utils/validation/provider-validator';

// Import Twenty framework types
import {
  WorkspaceEntity,
  WorkspaceField,
  WorkspaceIsNullable,
  WorkspaceIsUnique,
  BaseWorkspaceEntity,
} from './trib-message.workspace-entity';

/**
 * Phone number types supported by the system
 */
export enum TribPhoneNumberType {
  MOBILE = 'MOBILE',
  LANDLINE = 'LANDLINE',
  TOLL_FREE = 'TOLL_FREE',
  SHORT_CODE = 'SHORT_CODE',
  VOIP = 'VOIP',
}

/**
 * Phone number status tracking
 */
export enum TribPhoneNumberStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  VERIFIED = 'VERIFIED',
  BLOCKED = 'BLOCKED',
}

/**
 * Verification methods for phone numbers
 */
export enum TribVerificationMethod {
  SMS_CODE = 'SMS_CODE',
  VOICE_CALL = 'VOICE_CALL',
  CARRIER_LOOKUP = 'CARRIER_LOOKUP',
  MANUAL = 'MANUAL',
  WEBHOOK = 'WEBHOOK',
}

/**
 * TribPhoneNumber WorkspaceEntity
 *
 * Manages phone numbers for TRIB messaging system with provider capabilities
 * and comprehensive validation. Supports multi-provider architecture with
 * Twilio, AWS SNS, and Azure Communication Services.
 *
 * Features:
 * - Provider capability validation (SMS, MMS, Voice)
 * - E.164 phone number format validation
 * - Carrier information and metadata tracking
 * - Multi-tenant workspace isolation
 * - Comprehensive status tracking and verification
 *
 * @example
 * ```typescript
 * const phone = new TribPhoneNumberWorkspaceEntity();
 * phone.number = "+1234567890";
 * phone.type = TribPhoneNumberType.MOBILE;
 * phone.status = TribPhoneNumberStatus.ACTIVE;
 * phone.provider = "TWILIO";
 * phone.capabilities = ["SMS", "MMS"];
 * ```
 */
@WorkspaceEntity({
  standardId: TRIB_PHONE_NUMBER_OBJECT_IDS.PHONE_NUMBER,
  namePlural: 'tribPhoneNumbers',
  labelSingular: 'TRIB Phone Number',
  labelPlural: 'TRIB Phone Numbers',
  description:
    'A phone number in the TRIB messaging system with provider capabilities',
  icon: 'IconPhone',
  shortcut: 'P',
  labelIdentifierStandardId: PHONE_NUMBER_FIELD_IDS.number,
})
export class TribPhoneNumberWorkspaceEntity extends BaseWorkspaceEntity {
  /**
   * Phone number in E.164 format
   * Primary identifier with unique constraint for provider isolation
   */
  @WorkspaceField({
    standardId: PHONE_NUMBER_FIELD_IDS.number,
    type: 'TEXT',
    label: 'Phone Number',
    description: 'Phone number in E.164 format (+1234567890)',
    icon: 'IconPhone',
  })
  @WorkspaceIsUnique() // CRITICAL: Prevents duplicate phone numbers per workspace
  number: string;

  /**
   * Phone number type classification
   * Determines supported capabilities and routing
   */
  @WorkspaceField({
    standardId: PHONE_NUMBER_FIELD_IDS.type,
    type: 'SELECT',
    label: 'Type',
    description: 'Phone number type classification',
    icon: 'IconCategory',
    options: [
      { value: TribPhoneNumberType.MOBILE, label: 'Mobile', color: 'blue' },
      { value: TribPhoneNumberType.LANDLINE, label: 'Landline', color: 'gray' },
      {
        value: TribPhoneNumberType.TOLL_FREE,
        label: 'Toll Free',
        color: 'green',
      },
      {
        value: TribPhoneNumberType.SHORT_CODE,
        label: 'Short Code',
        color: 'purple',
      },
      { value: TribPhoneNumberType.VOIP, label: 'VoIP', color: 'orange' },
    ],
    defaultValue: TribPhoneNumberType.MOBILE,
  })
  type: TribPhoneNumberType;

  /**
   * Phone number operational status
   * Tracks activation, verification, and availability
   */
  @WorkspaceField({
    standardId: PHONE_NUMBER_FIELD_IDS.status,
    type: 'SELECT',
    label: 'Status',
    description: 'Phone number operational status',
    icon: 'IconCheck',
    options: [
      { value: TribPhoneNumberStatus.ACTIVE, label: 'Active', color: 'green' },
      {
        value: TribPhoneNumberStatus.INACTIVE,
        label: 'Inactive',
        color: 'gray',
      },
      {
        value: TribPhoneNumberStatus.SUSPENDED,
        label: 'Suspended',
        color: 'orange',
      },
      {
        value: TribPhoneNumberStatus.PENDING_VERIFICATION,
        label: 'Pending Verification',
        color: 'yellow',
      },
      {
        value: TribPhoneNumberStatus.VERIFIED,
        label: 'Verified',
        color: 'green',
      },
      { value: TribPhoneNumberStatus.BLOCKED, label: 'Blocked', color: 'red' },
    ],
    defaultValue: TribPhoneNumberStatus.PENDING_VERIFICATION,
  })
  status: TribPhoneNumberStatus;

  /**
   * Country code (ISO 3166-1 alpha-2)
   * Used for formatting and regulatory compliance
   */
  @WorkspaceField({
    standardId: PHONE_NUMBER_FIELD_IDS.countryCode,
    type: 'TEXT',
    label: 'Country Code',
    description: 'ISO 3166-1 alpha-2 country code (US, CA, etc.)',
    icon: 'IconFlag',
  })
  @WorkspaceIsNullable()
  countryCode: string | null;

  /**
   * Carrier/operator information
   * Extracted from phone number validation services
   */
  @WorkspaceField({
    standardId: PHONE_NUMBER_FIELD_IDS.carrier,
    type: 'TEXT',
    label: 'Carrier',
    description: 'Mobile carrier or service provider',
    icon: 'IconNetwork',
  })
  @WorkspaceIsNullable()
  carrier: string | null;

  /**
   * Provider-specific capabilities
   * JSON array of supported message types (SMS, MMS, Voice)
   */
  @WorkspaceField({
    standardId: PHONE_NUMBER_FIELD_IDS.capabilities,
    type: 'RAW_JSON',
    label: 'Capabilities',
    description: 'Supported messaging capabilities (SMS, MMS, Voice)',
    icon: 'IconSettings',
  })
  @WorkspaceIsNullable()
  capabilities: string[] | null;

  /**
   * Geographic region/area
   * Used for routing and compliance
   */
  @WorkspaceField({
    standardId: PHONE_NUMBER_FIELD_IDS.region,
    type: 'TEXT',
    label: 'Region',
    description: 'Geographic region or area code',
    icon: 'IconMap',
  })
  @WorkspaceIsNullable()
  region: string | null;

  /**
   * Timezone for the phone number location
   * Used for delivery scheduling and compliance
   */
  @WorkspaceField({
    standardId: PHONE_NUMBER_FIELD_IDS.timezone,
    type: 'TEXT',
    label: 'Timezone',
    description: 'Timezone identifier (America/New_York)',
    icon: 'IconClock',
  })
  @WorkspaceIsNullable()
  timezone: string | null;

  /**
   * Formatted display version of phone number
   * Human-readable format for UI display
   */
  @WorkspaceField({
    standardId: PHONE_NUMBER_FIELD_IDS.displayFormat,
    type: 'TEXT',
    label: 'Display Format',
    description: 'Formatted phone number for display (+1 (234) 567-8900)',
    icon: 'IconEye',
  })
  @WorkspaceIsNullable()
  displayFormat: string | null;

  /**
   * Phone number validation status
   * Tracks if number has been validated by carrier lookup
   */
  @WorkspaceField({
    standardId: PHONE_NUMBER_FIELD_IDS.validated,
    type: 'BOOLEAN',
    label: 'Validated',
    description: 'Whether phone number has been validated',
    icon: 'IconCheck',
    defaultValue: false,
  })
  validated: boolean;

  /**
   * Verification method used
   * How the phone number ownership was verified
   */
  @WorkspaceField({
    standardId: PHONE_NUMBER_FIELD_IDS.verificationMethod,
    type: 'SELECT',
    label: 'Verification Method',
    description: 'Method used to verify phone number ownership',
    icon: 'IconShield',
    options: [
      {
        value: TribVerificationMethod.SMS_CODE,
        label: 'SMS Code',
        color: 'blue',
      },
      {
        value: TribVerificationMethod.VOICE_CALL,
        label: 'Voice Call',
        color: 'green',
      },
      {
        value: TribVerificationMethod.CARRIER_LOOKUP,
        label: 'Carrier Lookup',
        color: 'purple',
      },
      { value: TribVerificationMethod.MANUAL, label: 'Manual', color: 'gray' },
      {
        value: TribVerificationMethod.WEBHOOK,
        label: 'Webhook',
        color: 'orange',
      },
    ],
  })
  @WorkspaceIsNullable()
  verificationMethod: TribVerificationMethod | null;

  /**
   * Provider-specific metadata
   * JSON field for additional provider-specific data
   */
  @WorkspaceField({
    standardId: PHONE_NUMBER_FIELD_IDS.metadata,
    type: 'RAW_JSON',
    label: 'Metadata',
    description: 'Provider-specific metadata and configuration',
    icon: 'IconCode',
  })
  @WorkspaceIsNullable()
  metadata: Record<string, any> | null;

  /**
   * Validates E.164 phone number format
   * @param phoneNumber - Phone number to validate
   * @returns True if phone number is valid E.164 format
   */
  static validateE164Format(phoneNumber: string): boolean {
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      return false;
    }

    // E.164 format: + followed by up to 15 digits
    const e164Regex = /^\+[1-9]\d{0,14}$/;
    return e164Regex.test(phoneNumber);
  }

  /**
   * Validates provider capabilities
   * @param provider - Provider name (TWILIO, AWS_SNS, etc.)
   * @param capabilities - Array of capabilities to validate
   * @returns True if provider supports all capabilities
   */
  static validateCapabilities(
    provider: string,
    capabilities: string[],
  ): boolean {
    if (!provider || !capabilities || !Array.isArray(capabilities)) {
      return false;
    }

    if (!isValidProvider(provider)) {
      return false;
    }

    return validateProviderCapabilities(provider, capabilities);
  }

  /**
   * Extracts country code from E.164 phone number
   * @param phoneNumber - E.164 formatted phone number
   * @returns Country calling code or null
   */
  static extractCountryCode(phoneNumber: string): string | null {
    if (!this.validateE164Format(phoneNumber)) {
      return null;
    }

    // Extract potential country codes (1-4 digits after +)
    const match = phoneNumber.match(/^\+(\d{1,4})/);
    if (!match) {
      return null;
    }

    // Common country codes for validation
    const validCodes = [
      '1',
      '7',
      '20',
      '27',
      '30',
      '31',
      '32',
      '33',
      '34',
      '36',
      '39',
      '40',
      '41',
      '43',
      '44',
      '45',
      '46',
      '47',
      '48',
      '49',
      '51',
      '52',
      '53',
      '54',
      '55',
      '56',
      '57',
      '58',
      '60',
      '61',
      '62',
      '63',
      '64',
      '65',
      '66',
      '81',
      '82',
      '84',
      '86',
      '90',
      '91',
      '92',
      '93',
      '94',
      '95',
      '98',
    ];

    // Try longest match first (4 digits), then 3, 2, 1
    for (let i = 4; i >= 1; i--) {
      const code = match[1].substring(0, i);
      if (validCodes.includes(code)) {
        return code;
      }
    }

    return match[1]; // Return raw code if not in our list
  }

  /**
   * Checks if phone number type supports specific capability
   * @param type - Phone number type
   * @param capability - Capability to check (SMS, MMS, Voice)
   * @returns True if type supports capability
   */
  static typeSupportsCapability(
    type: TribPhoneNumberType,
    capability: string,
  ): boolean {
    const supportMatrix: Record<TribPhoneNumberType, string[]> = {
      [TribPhoneNumberType.MOBILE]: ['SMS', 'MMS', 'VOICE'],
      [TribPhoneNumberType.LANDLINE]: ['VOICE'],
      [TribPhoneNumberType.TOLL_FREE]: ['SMS', 'VOICE'],
      [TribPhoneNumberType.SHORT_CODE]: ['SMS', 'MMS'],
      [TribPhoneNumberType.VOIP]: ['SMS', 'VOICE'],
    };

    return supportMatrix[type]?.includes(capability) || false;
  }

  /**
   * Validates timezone format
   * @param timezone - Timezone identifier to validate
   * @returns True if timezone is valid IANA format
   */
  static validateTimezone(timezone: string): boolean {
    if (!timezone || typeof timezone !== 'string') {
      return false;
    }

    // Additional validation - cannot be just continent or common abbreviations
    if (timezone.split('/').length < 2) {
      return false;
    }

    // Reject common non-IANA formats
    const invalidFormats = ['EST', 'GMT+5', 'UTC', 'GMT', 'PST', 'MST', 'CST'];
    if (invalidFormats.includes(timezone)) {
      return false;
    }

    // IANA timezone format validation - must have continent/city pattern
    // Must start with letter, contain forward slash, and have valid characters
    // Only allow known continent prefixes to be more restrictive
    const validPrefixes = [
      'America',
      'Europe',
      'Asia',
      'Africa',
      'Australia',
      'Pacific',
      'Atlantic',
      'Indian',
      'Antarctica',
    ];
    const parts = timezone.split('/');

    // Check if first part is a valid continent
    if (!validPrefixes.includes(parts[0])) {
      return false;
    }

    // Each part must be valid (letters, numbers, underscores, no spaces)
    const partRegex = /^[A-Za-z][A-Za-z0-9_]*$/;
    return parts.every((part) => partRegex.test(part));
  }

  /**
   * Checks if phone number is in a verified state
   * @param status - Phone number status
   * @returns True if status indicates verification
   */
  static isVerified(status: TribPhoneNumberStatus): boolean {
    return [
      TribPhoneNumberStatus.VERIFIED,
      TribPhoneNumberStatus.ACTIVE,
    ].includes(status);
  }

  /**
   * Checks if phone number can send messages
   * @param status - Phone number status
   * @returns True if status allows messaging
   */
  static canSendMessages(status: TribPhoneNumberStatus): boolean {
    return [
      TribPhoneNumberStatus.ACTIVE,
      TribPhoneNumberStatus.VERIFIED,
    ].includes(status);
  }
}
