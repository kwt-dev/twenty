/**
 * Person Repository Interface for TRIB Module
 *
 * Provides phone number lookup functionality without coupling
 * TRIB module to Twenty's ORM implementation.
 */

export interface PersonPhone {
  id: string;
  primaryPhoneNumber?: string | null;
  primaryPhoneCountryCode?: string | null;
  phone?: string | null; // deprecated field
  additionalPhones?: Array<{
    number: string;
    countryCode: string;
    callingCode: string;
  }> | null;
}

export interface IPersonRepository {
  /**
   * Find person by normalized phone number (E.164 format)
   * @param phoneNumber - Normalized phone number (e.g., "+15551234567")
   * @returns Person with phone data or null if not found
   */
  findByPhone(phoneNumber: string): Promise<PersonPhone | null>;

  /**
   * Find people by multiple phone number variations
   * Useful for handling different phone number formats
   * @param phoneNumbers - Array of phone number variations
   * @returns Array of matching persons (may be empty)
   */
  findByPhoneVariations(phoneNumbers: string[]): Promise<PersonPhone[]>;

  /**
   * Search both primary and additional phone fields
   * Handles both deprecated 'phone' field and modern 'phones' structure
   * @param phoneNumber - Phone number to search
   * @returns Person if found, null otherwise
   */
  findByPrimaryOrAdditionalPhone(
    phoneNumber: string,
  ): Promise<PersonPhone | null>;
}
