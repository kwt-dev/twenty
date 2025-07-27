/**
 * Phone Number Matching Utilities for Twenty CRM TRIB SMS Integration
 *
 * Mirrors the email matching pattern from Twenty's match-participant system.
 * Searches both primary and additional phone fields for Person matches in TRIB context.
 * Security-first with comprehensive audit logging for Twenty CRM.
 */

import { PersonPhone } from '../../interfaces/person.repository.interface';
import { normalizePhoneNumber, arePhoneNumbersEqual } from './phone-normalizer';
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
 * Find Twenty CRM person by primary or additional phone number from TRIB SMS
 * Mirrors findPersonByPrimaryOrAdditionalEmail pattern
 * @param people - Array of Twenty CRM person records
 * @param phoneNumber - Phone number from TRIB SMS to search
 * @returns Matching person or undefined
 */
export function findPersonByPrimaryOrAdditionalPhone({
  people,
  phoneNumber,
}: {
  people: PersonPhone[];
  phoneNumber: string;
}): PersonPhone | undefined {
  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  if (!normalizedPhone) {
    return undefined;
  }

  // Security audit log for TRIB SMS matching
  logger.debug('TRIB SMS phone matching attempt', {
    normalizedPhone,
    candidateCount: people.length,
    securityEvent: 'TRIB_PHONE_MATCH_ATTEMPT',
  });

  // Check primary phone number first in Twenty CRM
  const personWithPrimaryPhone = people.find((person) => {
    if (!person.primaryPhoneNumber) return false;
    return arePhoneNumbersEqual(person.primaryPhoneNumber, normalizedPhone);
  });

  if (personWithPrimaryPhone) {
    logger.info('TRIB SMS phone match found via primary phone', {
      personId: personWithPrimaryPhone.id,
      matchType: 'primary',
      securityEvent: 'TRIB_PHONE_MATCH_SUCCESS',
    });
    return personWithPrimaryPhone;
  }

  // Check deprecated phone field in Twenty CRM
  const personWithLegacyPhone = people.find((person) => {
    if (!person.phone) return false;
    return arePhoneNumbersEqual(person.phone, normalizedPhone);
  });

  if (personWithLegacyPhone) {
    logger.info('TRIB SMS phone match found via legacy phone', {
      personId: personWithLegacyPhone.id,
      matchType: 'legacy',
      securityEvent: 'TRIB_PHONE_MATCH_SUCCESS',
    });
    return personWithLegacyPhone;
  }

  // Check additional phones array in Twenty CRM
  const personWithAdditionalPhone = people.find((person) => {
    const additionalPhones = person.additionalPhones;

    if (!Array.isArray(additionalPhones)) {
      return false;
    }

    return additionalPhones.some((additionalPhone) =>
      arePhoneNumbersEqual(additionalPhone.number, normalizedPhone),
    );
  });

  if (personWithAdditionalPhone) {
    logger.info('TRIB SMS phone match found via additional phone', {
      personId: personWithAdditionalPhone.id,
      matchType: 'additional',
      securityEvent: 'TRIB_PHONE_MATCH_SUCCESS',
    });
    return personWithAdditionalPhone;
  }

  logger.debug('No TRIB SMS phone match found', {
    normalizedPhone,
    securityEvent: 'TRIB_PHONE_MATCH_NONE',
  });

  return undefined;
}

/**
 * Phone matching result with context for Twenty CRM TRIB SMS
 */
export interface PhoneMatchResult {
  person: PersonPhone | null;
  matchType: 'primary' | 'legacy' | 'additional' | 'none';
  normalizedPhone: string | null;
  ambiguous: boolean; // True if multiple people match same number
}

/**
 * Advanced phone matching with detailed results and security logging for TRIB SMS
 * @param people - Array of Twenty CRM person records
 * @param phoneNumber - Phone number from TRIB SMS to match
 * @returns Detailed match result
 */
export function matchPersonByPhone(
  people: PersonPhone[],
  phoneNumber: string,
): PhoneMatchResult {
  const normalizedPhone = normalizePhoneNumber(phoneNumber);

  if (!normalizedPhone) {
    return {
      person: null,
      matchType: 'none',
      normalizedPhone: null,
      ambiguous: false,
    };
  }

  // Find all matching people in Twenty CRM
  const matches = people.filter((person) => {
    // Check primary phone
    if (
      person.primaryPhoneNumber &&
      arePhoneNumbersEqual(person.primaryPhoneNumber, normalizedPhone)
    ) {
      return true;
    }

    // Check legacy phone
    if (person.phone && arePhoneNumbersEqual(person.phone, normalizedPhone)) {
      return true;
    }

    // Check additional phones
    if (
      person.additionalPhones?.some((phone) =>
        arePhoneNumbersEqual(phone.number, normalizedPhone),
      )
    ) {
      return true;
    }

    return false;
  });

  if (matches.length === 0) {
    return {
      person: null,
      matchType: 'none',
      normalizedPhone,
      ambiguous: false,
    };
  }

  if (matches.length > 1) {
    // Security: Log ambiguous matches in TRIB SMS context
    logger.warn('Ambiguous TRIB SMS phone match detected', {
      normalizedPhone,
      matchCount: matches.length,
      personIds: matches.map((p) => p.id),
      securityEvent: 'TRIB_PHONE_MATCH_AMBIGUOUS',
    });

    return {
      person: matches[0], // Return first match but flag as ambiguous
      matchType: 'primary', // Simplified for now
      normalizedPhone,
      ambiguous: true,
    };
  }

  // Single match - determine match type
  const person = matches[0];
  let matchType: PhoneMatchResult['matchType'] = 'none';

  if (
    person.primaryPhoneNumber &&
    arePhoneNumbersEqual(person.primaryPhoneNumber, normalizedPhone)
  ) {
    matchType = 'primary';
  } else if (
    person.phone &&
    arePhoneNumbersEqual(person.phone, normalizedPhone)
  ) {
    matchType = 'legacy';
  } else if (
    person.additionalPhones?.some((phone) =>
      arePhoneNumbersEqual(phone.number, normalizedPhone),
    )
  ) {
    matchType = 'additional';
  }

  return {
    person,
    matchType,
    normalizedPhone,
    ambiguous: false,
  };
}
