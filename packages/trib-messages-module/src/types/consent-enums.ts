/**
 * TRIB Consent Enums
 *
 * This file contains all enum definitions for TCPA consent tracking,
 * including status values, source types, and verification methods.
 */

/**
 * Consent Status Enum
 *
 * Defines the current consent status for TCPA compliance.
 * Status transitions must follow legal requirements.
 */
export enum ConsentStatus {
  /**
   * User has explicitly opted in to receive messages
   */
  OPTED_IN = 'OPTED_IN',

  /**
   * User has explicitly opted out of receiving messages
   */
  OPTED_OUT = 'OPTED_OUT',

  /**
   * Consent request is pending user response
   */
  PENDING = 'PENDING',

  /**
   * Consent status is unknown or unverified
   */
  UNKNOWN = 'UNKNOWN',
}

/**
 * Consent Source Enum
 *
 * Defines the channel through which consent was obtained.
 * Required for TCPA compliance audit trails.
 */
export enum ConsentSource {
  /**
   * Consent obtained through web form
   */
  WEB_FORM = 'WEB_FORM',

  /**
   * Consent obtained through SMS keyword response
   */
  SMS_KEYWORD = 'SMS_KEYWORD',

  /**
   * Consent obtained through API call
   */
  API = 'API',

  /**
   * Consent obtained through phone call
   */
  PHONE_CALL = 'PHONE_CALL',

  /**
   * Consent obtained through email
   */
  EMAIL = 'EMAIL',

  /**
   * Consent obtained through mobile app
   */
  MOBILE_APP = 'MOBILE_APP',

  /**
   * Consent obtained through integration partner
   */
  INTEGRATION = 'INTEGRATION',

  /**
   * Consent obtained through manual entry
   */
  MANUAL = 'MANUAL',

  /**
   * Consent source is unknown or unspecified
   */
  UNKNOWN = 'UNKNOWN',
}

/**
 * Consent Type Enum
 *
 * Defines the type of consent for different message categories.
 * Each type has different legal requirements and restrictions.
 */
export enum ConsentType {
  /**
   * Consent for marketing and promotional messages
   */
  MARKETING = 'MARKETING',

  /**
   * Consent for transactional messages (order confirmations, etc.)
   */
  TRANSACTIONAL = 'TRANSACTIONAL',

  /**
   * Consent for informational messages (notifications, updates)
   */
  INFORMATIONAL = 'INFORMATIONAL',

  /**
   * Consent for emergency or urgent messages
   */
  EMERGENCY = 'EMERGENCY',

  /**
   * Consent for service-related messages
   */
  SERVICE = 'SERVICE',

  /**
   * General consent for all message types
   */
  ALL = 'ALL',
}

/**
 * Consent Verification Method Enum
 *
 * Defines how consent was verified for enhanced compliance.
 */
export enum ConsentVerificationMethod {
  /**
   * Double opt-in via email confirmation
   */
  EMAIL_DOUBLE_OPTIN = 'EMAIL_DOUBLE_OPTIN',

  /**
   * SMS keyword confirmation
   */
  SMS_KEYWORD_CONFIRMATION = 'SMS_KEYWORD_CONFIRMATION',

  /**
   * Phone number verification
   */
  PHONE_VERIFICATION = 'PHONE_VERIFICATION',

  /**
   * Manual verification by support team
   */
  MANUAL_VERIFICATION = 'MANUAL_VERIFICATION',

  /**
   * API verification with authentication
   */
  API_VERIFICATION = 'API_VERIFICATION',

  /**
   * No verification performed
   */
  NONE = 'NONE',
}

/**
 * Legal Basis Enum
 *
 * Defines the legal basis for processing consent data.
 * Required for GDPR and other privacy regulations.
 */
export enum LegalBasis {
  /**
   * Explicit consent from data subject
   */
  CONSENT = 'CONSENT',

  /**
   * Processing necessary for contract performance
   */
  CONTRACT = 'CONTRACT',

  /**
   * Processing necessary for legal obligation
   */
  LEGAL_OBLIGATION = 'LEGAL_OBLIGATION',

  /**
   * Processing necessary for vital interests
   */
  VITAL_INTERESTS = 'VITAL_INTERESTS',

  /**
   * Processing necessary for public task
   */
  PUBLIC_TASK = 'PUBLIC_TASK',

  /**
   * Processing necessary for legitimate interests
   */
  LEGITIMATE_INTERESTS = 'LEGITIMATE_INTERESTS',
}

/**
 * Type guard to check if a value is a valid ConsentStatus
 */
export function isConsentStatus(value: string): value is ConsentStatus {
  return Object.values(ConsentStatus).includes(value as ConsentStatus);
}

/**
 * Type guard to check if a value is a valid ConsentSource
 */
export function isConsentSource(value: string): value is ConsentSource {
  return Object.values(ConsentSource).includes(value as ConsentSource);
}

/**
 * Type guard to check if a value is a valid ConsentType
 */
export function isConsentType(value: string): value is ConsentType {
  return Object.values(ConsentType).includes(value as ConsentType);
}

/**
 * Type guard to check if a value is a valid ConsentVerificationMethod
 */
export function isConsentVerificationMethod(
  value: string,
): value is ConsentVerificationMethod {
  return Object.values(ConsentVerificationMethod).includes(
    value as ConsentVerificationMethod,
  );
}

/**
 * Type guard to check if a value is a valid LegalBasis
 */
export function isLegalBasis(value: string): value is LegalBasis {
  return Object.values(LegalBasis).includes(value as LegalBasis);
}

/**
 * Valid consent status transitions for TCPA compliance
 */
export const VALID_CONSENT_TRANSITIONS: Record<ConsentStatus, ConsentStatus[]> =
  {
    [ConsentStatus.UNKNOWN]: [
      ConsentStatus.PENDING,
      ConsentStatus.OPTED_IN,
      ConsentStatus.OPTED_OUT,
    ],
    [ConsentStatus.PENDING]: [ConsentStatus.OPTED_IN, ConsentStatus.OPTED_OUT],
    [ConsentStatus.OPTED_IN]: [ConsentStatus.OPTED_OUT],
    [ConsentStatus.OPTED_OUT]: [ConsentStatus.OPTED_IN], // Can opt back in
  };

/**
 * Helper function to validate consent status transitions
 */
export function isValidConsentTransition(
  fromStatus: ConsentStatus,
  toStatus: ConsentStatus,
): boolean {
  return VALID_CONSENT_TRANSITIONS[fromStatus]?.includes(toStatus) ?? false;
}

/**
 * Export all consent-related enums and types
 */
export type ConsentEnums = {
  ConsentStatus: typeof ConsentStatus;
  ConsentSource: typeof ConsentSource;
  ConsentType: typeof ConsentType;
  ConsentVerificationMethod: typeof ConsentVerificationMethod;
  LegalBasis: typeof LegalBasis;
};

/**
 * Combined export of all consent enums
 */
export const CONSENT_ENUMS: ConsentEnums = {
  ConsentStatus,
  ConsentSource,
  ConsentType,
  ConsentVerificationMethod,
  LegalBasis,
};
