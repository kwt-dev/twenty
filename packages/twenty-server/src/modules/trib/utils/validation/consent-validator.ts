/**
 * TRIB Consent Validator
 *
 * Provides comprehensive validation for TCPA consent records,
 * including status validation, date consistency, and compliance checks.
 */

import { parsePhoneNumberWithError } from 'libphonenumber-js';
import {
  ConsentStatus,
  ConsentSource,
  ConsentType,
  ConsentVerificationMethod,
  LegalBasis,
  isConsentStatus,
  isConsentSource,
  isConsentType,
  isConsentVerificationMethod,
  isLegalBasis,
  isValidConsentTransition,
  VALID_CONSENT_TRANSITIONS,
} from '../../types/consent-enums';

/**
 * Interface for consent date validation
 */
export interface ConsentDates {
  optInDate?: Date | null;
  optOutDate?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Interface for consent record validation
 */
export interface ConsentRecord {
  phoneNumber: string;
  status: ConsentStatus;
  source: ConsentSource;
  type?: ConsentType;
  verificationMethod?: ConsentVerificationMethod;
  legalBasis?: LegalBasis;
  optInDate?: Date | null;
  optOutDate?: Date | null;
  metadata?: Record<string, unknown>;
  contactId?: string;
}

/**
 * Validation result interface
 */
export interface ConsentValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates consent status and ensures proper TCPA compliance
 *
 * @param status - Current consent status
 * @param dates - Associated dates for validation
 * @returns Boolean indicating if consent status is valid
 */
export function validateConsentStatus(
  status: string,
  dates: ConsentDates,
): boolean {
  // Validate enum value
  if (!isConsentStatus(status)) {
    return false;
  }

  // Validate date consistency based on status
  switch (status) {
    case ConsentStatus.OPTED_IN:
      // Must have opt-in date, should not have opt-out date after opt-in
      if (!dates.optInDate) {
        return false;
      }
      if (dates.optOutDate && dates.optOutDate > dates.optInDate) {
        return false;
      }
      break;

    case ConsentStatus.OPTED_OUT:
      // Must have opt-out date
      if (!dates.optOutDate) {
        return false;
      }
      // If both dates exist, opt-out should be after opt-in
      if (dates.optInDate && dates.optOutDate < dates.optInDate) {
        return false;
      }
      break;

    case ConsentStatus.PENDING:
      // Should not have opt-in or opt-out dates
      if (dates.optInDate || dates.optOutDate) {
        return false;
      }
      break;

    case ConsentStatus.UNKNOWN:
      // No date requirements for unknown status
      break;
  }

  return true;
}

/**
 * Validates phone number format for TCPA compliance using industry-standard libphonenumber-js
 *
 * @param phoneNumber - Phone number to validate
 * @returns Boolean indicating if phone number is valid
 */
export function validatePhoneNumber(phoneNumber: string): boolean {
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return false;
  }

  try {
    // Try parsing with default country first (US), then without default for international
    let parsed;
    try {
      parsed = parsePhoneNumberWithError(phoneNumber, 'US');
    } catch {
      // If parsing with US default fails, try without default for international numbers
      parsed = parsePhoneNumberWithError(phoneNumber);
    }

    // Check if the parsed number is valid
    if (!parsed.isValid()) {
      return false;
    }

    // Additional TCPA compliance checks for US/Canada numbers only
    if (parsed.country === 'US' || parsed.country === 'CA') {
      const nationalNumber = parsed.nationalNumber;

      // Must be exactly 10 digits for US/Canada
      if (nationalNumber.length !== 10) {
        return false;
      }

      const areaCode = nationalNumber.substring(0, 3);

      // Area code validation (first digit 2-9)
      if (areaCode[0] < '2' || areaCode[0] > '9') {
        return false;
      }

      // Note: libphonenumber-js already validates exchange codes and other NANP rules
    }

    return true;
  } catch (error) {
    // Invalid phone number format
    return false;
  }
}

/**
 * Normalizes phone number to E.164 format for Twilio compatibility
 *
 * @param phoneNumber - Phone number to normalize
 * @returns E.164 formatted phone number or null if invalid
 */
export function normalizePhoneNumber(phoneNumber: string): string | null {
  if (!validatePhoneNumber(phoneNumber)) {
    return null;
  }

  try {
    const parsed = parsePhoneNumberWithError(phoneNumber, 'US');
    return parsed.format('E.164'); // Returns format like +12125551234
  } catch (error) {
    return null;
  }
}

/**
 * Validates consent source for TCPA compliance
 *
 * @param source - Consent source to validate
 * @returns Boolean indicating if source is valid
 */
export function validateConsentSource(source: string): boolean {
  return isConsentSource(source);
}

/**
 * Validates consent date consistency for TCPA compliance
 *
 * @param dates - Dates to validate
 * @returns Boolean indicating if dates are consistent
 */
export function validateConsentDates(dates: ConsentDates): boolean {
  const { optInDate, optOutDate, createdAt, updatedAt } = dates;
  const now = new Date();

  // If both opt-in and opt-out dates exist, opt-out must be after opt-in
  if (optInDate && optOutDate) {
    if (optOutDate <= optInDate) {
      return false;
    }
  }

  // Created date should be before updated date
  if (createdAt && updatedAt) {
    if (updatedAt < createdAt) {
      return false;
    }
  }

  // Opt-in date should not be in the future
  if (optInDate && optInDate > now) {
    return false;
  }

  // Opt-out date should not be in the future
  if (optOutDate && optOutDate > now) {
    return false;
  }

  return true;
}

/**
 * Validates consent transition for TCPA compliance
 *
 * @param fromStatus - Current consent status
 * @param toStatus - Target consent status
 * @returns Boolean indicating if transition is valid
 */
export function validateConsentTransition(
  fromStatus: ConsentStatus,
  toStatus: ConsentStatus,
): boolean {
  return isValidConsentTransition(fromStatus, toStatus);
}

/**
 * Comprehensive consent record validation
 *
 * @param record - Consent record to validate
 * @returns Validation result with details
 */
export function validateConsentRecord(
  record: ConsentRecord,
): ConsentValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate required fields
  if (!record.phoneNumber) {
    errors.push('Phone number is required');
  } else if (!validatePhoneNumber(record.phoneNumber)) {
    errors.push('Phone number format is invalid');
  }

  if (!record.status) {
    errors.push('Consent status is required');
  } else if (!isConsentStatus(record.status)) {
    errors.push('Invalid consent status');
  }

  if (!record.source) {
    errors.push('Consent source is required');
  } else if (!isConsentSource(record.source)) {
    errors.push('Invalid consent source');
  }

  // Validate optional enums
  if (record.type && !isConsentType(record.type)) {
    errors.push('Invalid consent type');
  }

  if (
    record.verificationMethod &&
    !isConsentVerificationMethod(record.verificationMethod)
  ) {
    errors.push('Invalid verification method');
  }

  if (record.legalBasis && !isLegalBasis(record.legalBasis)) {
    errors.push('Invalid legal basis');
  }

  // Validate dates
  const dates: ConsentDates = {
    optInDate: record.optInDate,
    optOutDate: record.optOutDate,
  };

  if (!validateConsentDates(dates)) {
    errors.push('Consent dates are inconsistent');
  }

  // Validate status-specific requirements
  if (record.status && isConsentStatus(record.status)) {
    if (!validateConsentStatus(record.status, dates)) {
      errors.push(
        `Consent status ${record.status} is inconsistent with provided dates`,
      );
    }
  }

  // Validate metadata
  if (record.metadata) {
    if (typeof record.metadata !== 'object' || Array.isArray(record.metadata)) {
      errors.push('Metadata must be a valid object');
    }
  }

  // Validate contact ID format (if provided)
  if (record.contactId !== undefined) {
    if (
      typeof record.contactId !== 'string' ||
      record.contactId.trim().length === 0
    ) {
      errors.push('Contact ID must be a non-empty string');
    }
  }

  // Add warnings for best practices
  if (record.status === ConsentStatus.OPTED_IN && !record.verificationMethod) {
    warnings.push('Verification method recommended for opted-in consent');
  }

  if (
    record.status === ConsentStatus.OPTED_IN &&
    record.type === ConsentType.MARKETING &&
    !record.optInDate
  ) {
    warnings.push('Opt-in date required for marketing consent');
  }

  if (record.source === ConsentSource.UNKNOWN) {
    warnings.push('Consent source should be specified for better compliance');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates consent metadata for TCPA compliance
 *
 * @param metadata - Metadata object to validate
 * @returns Boolean indicating if metadata is valid
 */
export function validateConsentMetadata(
  metadata: Record<string, unknown>,
): boolean {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return false;
  }

  // Check for required compliance fields in metadata
  const requiredFields = ['userAgent', 'ipAddress', 'timestamp'];
  const hasRequiredFields = requiredFields.some((field) => field in metadata);

  if (!hasRequiredFields) {
    return false;
  }

  return true;
}

/**
 * Gets valid consent status transitions
 *
 * @param currentStatus - Current consent status
 * @returns Array of valid target statuses
 */
export function getValidConsentTransitions(
  currentStatus: ConsentStatus,
): ConsentStatus[] {
  return VALID_CONSENT_TRANSITIONS[currentStatus] || [];
}

/**
 * Checks if consent is expired based on metadata
 *
 * @param optInDate - Date when consent was granted
 * @param metadata - Consent metadata potentially containing expiry info
 * @returns Boolean indicating if consent is expired
 */
export function isConsentExpired(
  optInDate: Date | null,
  metadata?: Record<string, unknown>,
): boolean {
  if (!optInDate) {
    return false;
  }

  // Check for explicit expiry date in metadata
  if (metadata?.expiryDate) {
    const expiryDate = new Date(metadata.expiryDate as string);
    return expiryDate < new Date();
  }

  // Default expiry: 18 months for marketing consent (TCPA best practice)
  const eighteenMonthsAgo = new Date();
  eighteenMonthsAgo.setMonth(eighteenMonthsAgo.getMonth() - 18);

  return optInDate < eighteenMonthsAgo;
}

/**
 * Export all validation functions
 */
export const consentValidator = {
  validateConsentStatus,
  validatePhoneNumber,
  normalizePhoneNumber,
  validateConsentSource,
  validateConsentDates,
  validateConsentTransition,
  validateConsentRecord,
  validateConsentMetadata,
  getValidConsentTransitions,
  isConsentExpired,
};
