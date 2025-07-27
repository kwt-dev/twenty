/**
 * Phone Number Normalization Utilities for Twenty CRM TRIB SMS Integration
 *
 * Handles phone number parsing, validation, and E.164 normalization
 * for consistent matching across different phone number formats in TRIB SMS.
 * Security-first approach with comprehensive input validation.
 */

import { parsePhoneNumber, CountryCode } from 'libphonenumber-js';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [new winston.transports.Console()],
});

/**
 * Normalize phone number to E.164 format with security validation for Twenty CRM
 * @param phoneNumber - Input phone number from TRIB SMS (any format)
 * @param defaultCountry - Default country for parsing
 * @returns Normalized E.164 phone number or null if invalid
 */
export function normalizePhoneNumber(
  phoneNumber: string,
  defaultCountry: CountryCode = 'US',
): string | null {
  // Security: Input validation
  if (!phoneNumber?.trim()) {
    return null;
  }

  // Security: Length validation to prevent DoS attacks on TRIB SMS
  if (phoneNumber.length > 50) {
    logger.warn('Phone number too long - potential security issue', {
      length: phoneNumber.length,
      securityEvent: 'TRIB_PHONE_LENGTH_VIOLATION',
    });
    return null;
  }

  try {
    const parsed = parsePhoneNumber(phoneNumber, defaultCountry);

    if (!parsed.isValid()) {
      return null;
    }

    return parsed.format('E.164'); // Returns "+15551234567"
  } catch (error) {
    // Security: Log parsing errors without exposing input in TRIB context
    logger.warn('Phone number parsing failed in TRIB SMS', {
      error: error instanceof Error ? error.message : String(error),
      securityEvent: 'TRIB_PHONE_PARSE_ERROR',
    });
    return null;
  }
}

/**
 * Generate phone number variations for fuzzy matching in Twenty CRM database
 * Helps match against different storage formats from TRIB SMS
 * @param phoneNumber - Input phone number
 * @returns Array of phone number variations
 */
export function getPhoneVariations(phoneNumber: string): string[] {
  const normalized = normalizePhoneNumber(phoneNumber);
  if (!normalized) {
    return [phoneNumber]; // Return original if normalization fails
  }

  const variations = new Set<string>([
    normalized, // "+15551234567"
    normalized.substring(1), // "15551234567"
  ]);

  // For US/Canada numbers, add common formats from TRIB SMS
  if (normalized.startsWith('+1') && normalized.length === 12) {
    const digits = normalized.substring(2); // "5551234567"
    variations.add(digits);
    variations.add(
      `(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`,
    );
    variations.add(
      `${digits.substring(0, 3)}-${digits.substring(3, 6)}-${digits.substring(6)}`,
    );
  }

  return Array.from(variations);
}

/**
 * Compare two phone numbers for equality with security validation for Twenty CRM
 * @param phone1 - First phone number
 * @param phone2 - Second phone number
 * @param defaultCountry - Default country code
 * @returns true if phones are equivalent
 */
export function arePhoneNumbersEqual(
  phone1: string,
  phone2: string,
  defaultCountry: CountryCode = 'US',
): boolean {
  const normalized1 = normalizePhoneNumber(phone1, defaultCountry);
  const normalized2 = normalizePhoneNumber(phone2, defaultCountry);

  return normalized1 !== null && normalized1 === normalized2;
}
