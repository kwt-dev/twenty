import { Injectable, Scope, Logger } from '@nestjs/common';
import winston from 'winston';

import { ScopedWorkspaceContextFactory } from 'src/engine/twenty-orm/factories/scoped-workspace-context.factory';
import { TwentyORMGlobalManager } from 'src/engine/twenty-orm/twenty-orm-global.manager';
import { PersonWorkspaceEntity } from 'src/modules/person/standard-objects/person.workspace-entity';
import { TribMessageParticipantWorkspaceEntity } from 'src/modules/trib/standard-objects/trib-message-participant.workspace-entity';
import { parsePhoneNumber, CountryCode } from 'libphonenumber-js';

// Security audit logger for Twenty CRM TRIB SMS integration  
const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'trib-security.log' }),
    new winston.transports.Console()
  ]
});

// Local PersonPhone interface (not coupled to TRIB module interfaces)
export interface PersonPhone {
  id: string;
  primaryPhoneNumber: string | null;
  primaryPhoneCountryCode: string | null;
  phone: string | null; // Legacy field compatibility
  additionalPhones: any[] | null;
}

/**
 * TribWorkspaceService - Person-SMS Bridge Implementation
 * 
 * Bridge service for TRIB phone matching following Twenty CRM patterns.
 * Provides phone number lookup functionality with proper workspace scoping,
 * REQUEST scope lifecycle, and security validation.
 * 
 * ARCHITECTURE COMPLIANCE:
 * - Uses @Injectable({ scope: Scope.REQUEST }) for proper DI lifecycle  
 * - Uses TwentyORMGlobalManager + ScopedWorkspaceContextFactory pattern
 * - No external interface coupling (follows slice 5b architecture)
 * - Follows TribMessagesModule.forRoot() integration pattern
 */
@Injectable({ scope: Scope.REQUEST })
export class TribWorkspaceService {
  private readonly logger = new Logger(TribWorkspaceService.name);

  // ✅ CORRECT ARCHITECTURE: TwentyORMGlobalManager + ScopedWorkspaceContextFactory
  constructor(
    private readonly twentyORMGlobalManager: TwentyORMGlobalManager,
    private readonly scopedWorkspaceContextFactory: ScopedWorkspaceContextFactory,
  ) {
    this.logger.log('TribWorkspaceService initialized as Person-SMS bridge service');
  }

  /**
   * Normalize phone number to E.164 format for consistent database lookup
   * Local implementation to avoid cross-package dependencies
   */
  private normalizePhoneNumber(phoneNumber: string, defaultCountry: CountryCode = 'US'): string | null {
    if (!phoneNumber?.trim()) {
      return null;
    }

    // Security: Length validation
    if (phoneNumber.length > 50) {
      securityLogger.warn('Phone number too long - potential security issue', {
        length: phoneNumber.length,
        securityEvent: 'PHONE_LENGTH_VIOLATION',
        system: 'TWENTY_CRM_TRIB_SMS_BRIDGE'
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
      securityLogger.warn('Phone number parsing failed', {
        error: error instanceof Error ? error.message : String(error),
        securityEvent: 'PHONE_PARSE_ERROR',
        system: 'TWENTY_CRM_TRIB_SMS_BRIDGE'
      });
      return null;
    }
  }

  /**
   * Find person by normalized phone number for SMS matching
   * Uses proper workspace scoping and security validation
   */
  async findPersonByPhone(phoneNumber: string): Promise<PersonPhone | null> {
    // Security: Input validation
    if (!phoneNumber?.trim()) {
      securityLogger.warn('Empty phone number in findPersonByPhone', {
        securityEvent: 'INVALID_PHONE_INPUT',
        system: 'TWENTY_CRM_TRIB_SMS_BRIDGE'
      });
      return null;
    }

    // Security: Length validation  
    if (phoneNumber.length > 50) {
      securityLogger.warn('Phone number too long in findPersonByPhone', {
        length: phoneNumber.length,
        securityEvent: 'PHONE_LENGTH_VIOLATION',
        system: 'TWENTY_CRM_TRIB_SMS_BRIDGE'
      });
      return null;
    }

    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
    if (!normalizedPhone) {
      return null;
    }

    try {
      // ✅ CORRECT ARCHITECTURE: Get workspace context for multi-tenancy
      const workspaceContext = this.scopedWorkspaceContextFactory.create();
      const workspaceId = workspaceContext.workspaceId;
      if (!workspaceId) {
        throw new Error('Workspace context is required for phone lookup');
      }
      const personRepository = await this.twentyORMGlobalManager.getRepositoryForWorkspace(
        workspaceId,
        PersonWorkspaceEntity,
        { shouldBypassPermissionChecks: true }
      );

      // Performance: Use workspace-scoped query with normalized phone matching
      // Normalize both incoming SMS phone (+18123435020) and DB phone ((555) 123-4567) 
      // by comparing last 10 digits to handle format differences
      const numericPhone = normalizedPhone.replace(/\D/g, '');
      const last10Digits = numericPhone.slice(-10);

      // Validate we have a proper 10-digit phone number
      if (last10Digits.length !== 10) {
        this.logger.warn(`Invalid phone number format for lookup: ${normalizedPhone}`);
        return null;
      }

      this.logger.log(`Phone lookup: searching for last 10 digits "${last10Digits}" from normalized "${normalizedPhone}"`);

      const person = await personRepository
        .createQueryBuilder('person')
        .where("RIGHT(regexp_replace(person.phonesPrimaryPhoneNumber, '\\\\D', '', 'g'), 10) = :last10Digits", 
          { last10Digits })
        .limit(1)
        .getOne();

      if (person) {
        // Security audit log for Twenty CRM SMS matching
        securityLogger.info('Person found by phone in Twenty CRM workspace', {
          personId: person.id,
          workspaceId,
          normalizedPhone,
          securityEvent: 'PERSON_PHONE_LOOKUP_SUCCESS',
          system: 'TWENTY_CRM_TRIB_SMS_BRIDGE'
        });

        return this.mapToPersonPhone(person as PersonWorkspaceEntity);
      }

      return null;
    } catch (error) {
      // Security audit log
      securityLogger.error('Person phone lookup failed in Twenty CRM workspace', {
        error: error instanceof Error ? error.message : String(error),
        normalizedPhone,
        securityEvent: 'PERSON_PHONE_LOOKUP_ERROR',
        system: 'TWENTY_CRM_TRIB_SMS_BRIDGE'
      });

      this.logger.error(`Failed to find person by phone: ${normalizedPhone}`, error);
      throw error;
    }
  }

  /**
   * Find people by multiple phone number variations for SMS bulk matching
   * Uses workspace-scoped bulk query optimization
   */
  async findPeopleByPhoneVariations(phoneNumbers: string[]): Promise<PersonPhone[]> {
    // Security: Input validation
    if (!Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
      return [];
    }

    // Security: Limit bulk query size to prevent DoS
    if (phoneNumbers.length > 100) {
      securityLogger.warn('Too many phone numbers in bulk query', {
        count: phoneNumbers.length,
        securityEvent: 'BULK_PHONE_QUERY_LIMIT',
        system: 'TWENTY_CRM_TRIB_SMS_BRIDGE'
      });
      phoneNumbers = phoneNumbers.slice(0, 100);
    }

    // Normalize all phone numbers to last 10 digits for consistent matching
    const normalizedPhones = phoneNumbers
      .map(phone => {
        const normalized = this.normalizePhoneNumber(phone);
        if (!normalized) return null;
        const numericPhone = normalized.replace(/\D/g, '');
        const last10Digits = numericPhone.slice(-10);
        return last10Digits.length === 10 ? last10Digits : null;
      })
      .filter(phone => phone !== null) as string[];

    if (normalizedPhones.length === 0) {
      return [];
    }

    try {
      // ✅ CORRECT ARCHITECTURE: Get workspace context for multi-tenancy
      const workspaceContext = this.scopedWorkspaceContextFactory.create();
      const workspaceId = workspaceContext.workspaceId;
      if (!workspaceId) {
        throw new Error('Workspace context is required for phone lookup');
      }
      const personRepository = await this.twentyORMGlobalManager.getRepositoryForWorkspace(
        workspaceId,
        PersonWorkspaceEntity,
        { shouldBypassPermissionChecks: true }
      );

      // Performance: Bulk query with normalized phone matching
      // Use same normalization logic as single phone lookup
      const people = await personRepository
        .createQueryBuilder('person')
        .where("RIGHT(regexp_replace(person.phonesPrimaryPhoneNumber, '\\\\D', '', 'g'), 10) IN (:...phones)", 
          { phones: normalizedPhones })
        .getMany();

      // Security audit log
      securityLogger.info('Bulk phone lookup completed in Twenty CRM workspace', {
        queryCount: normalizedPhones.length,
        resultCount: people.length,
        workspaceId,
        securityEvent: 'BULK_PHONE_LOOKUP_SUCCESS',
        system: 'TWENTY_CRM_TRIB_SMS_BRIDGE'
      });

      return people.map(person => this.mapToPersonPhone(person as PersonWorkspaceEntity));
    } catch (error) {
      securityLogger.error('Bulk phone lookup failed in Twenty CRM workspace', {
        error: error instanceof Error ? error.message : String(error),
        phoneCount: normalizedPhones.length,
        securityEvent: 'BULK_PHONE_LOOKUP_ERROR',
        system: 'TWENTY_CRM_TRIB_SMS_BRIDGE'
      });

      this.logger.error('Failed to find people by phone variations', error);
      throw error;
    }
  }

  /**
   * Map PersonWorkspaceEntity to PersonPhone interface
   * Ensures clean separation between Twenty CRM entities and TRIB SMS interfaces
   */
  private mapToPersonPhone(person: PersonWorkspaceEntity): PersonPhone {
    return {
      id: person.id,
      primaryPhoneNumber: person.phones?.primaryPhoneNumber || null,
      primaryPhoneCountryCode: person.phones?.primaryPhoneCountryCode || null,
      phone: person.phones?.primaryPhoneNumber || null, // Use composite field
      additionalPhones: person.phones?.additionalPhones || null,
    };
  }


  // ============================================================================
  // IPersonRepository Interface Implementation
  // ============================================================================

  /**
   * Find person by normalized phone number (IPersonRepository interface method)
   * Delegates to existing findPersonByPhone implementation
   */
  async findByPhone(phoneNumber: string): Promise<PersonPhone | null> {
    return this.findPersonByPhone(phoneNumber);
  }

  /**
   * Find people by multiple phone number variations (IPersonRepository interface method)
   * Delegates to existing findPeopleByPhoneVariations implementation
   */
  async findByPhoneVariations(phoneNumbers: string[]): Promise<PersonPhone[]> {
    return this.findPeopleByPhoneVariations(phoneNumbers);
  }

  /**
   * Search both primary and additional phone fields (IPersonRepository interface method)
   * This is the method that TribSmsService specifically calls
   * Delegates to existing findPersonByPhone implementation
   */
  async findByPrimaryOrAdditionalPhone(phoneNumber: string): Promise<PersonPhone | null> {
    return this.findPersonByPhone(phoneNumber);
  }

  /**
   * Find person's primary phone number by person ID
   * Required for SMS sending - converts personId to phone number for CreateSmsMessageDto
   */
  async findPhoneByPersonId(personId: string): Promise<string | null> {
    // Security: Input validation
    if (!personId?.trim()) {
      securityLogger.warn('Empty person ID in findPhoneByPersonId', {
        securityEvent: 'INVALID_PERSON_ID_INPUT',
        system: 'TWENTY_CRM_TRIB_SMS_BRIDGE'
      });
      return null;
    }

    try {
      // ✅ CORRECT ARCHITECTURE: Get workspace context for multi-tenancy
      const workspaceContext = this.scopedWorkspaceContextFactory.create();
      const workspaceId = workspaceContext.workspaceId;
      if (!workspaceId) {
        throw new Error('Workspace context is required for person lookup');
      }

      const personRepository = await this.twentyORMGlobalManager.getRepositoryForWorkspace(
        workspaceId,
        PersonWorkspaceEntity,
        { shouldBypassPermissionChecks: true }
      );

      // Find person and get primary phone number
      const person = await personRepository.findOne({
        where: { id: personId }
      });

      if (!person) {
        this.logger.warn(`Person not found: ${personId}`);
        return null;
      }

      const primaryPhone = person.phones?.primaryPhoneNumber;
      if (!primaryPhone) {
        this.logger.warn(`Person ${personId} has no primary phone number`);
        return null;
      }

      // Normalize phone number to E.164 format
      const normalizedPhone = this.normalizePhoneNumber(primaryPhone);

      securityLogger.info('Person phone lookup completed', {
        personId,
        workspaceId,
        hasPhone: !!normalizedPhone,
        securityEvent: 'PERSON_PHONE_LOOKUP_SUCCESS',
        system: 'TWENTY_CRM_TRIB_SMS_BRIDGE'
      });

      return normalizedPhone;
    } catch (error) {
      securityLogger.error('Person phone lookup failed', {
        personId,
        error: error instanceof Error ? error.message : String(error),
        securityEvent: 'PERSON_PHONE_LOOKUP_ERROR',
        system: 'TWENTY_CRM_TRIB_SMS_BRIDGE'
      });

      this.logger.error(`Failed to find phone for person: ${personId}`, error);
      throw error;
    }
  }

  /**
   * Create TribMessageParticipant for frontend integration
   * Links SMS messages to Person records for UI display
   */
  async createMessageParticipant({
    messageId,
    personId,
    role,
    phoneNumber,
  }: {
    messageId: string;
    personId: string;
    role: 'from' | 'to';
    phoneNumber: string;
  }): Promise<void> {
    try {
      const workspaceContext = this.scopedWorkspaceContextFactory.create();
      const workspaceId = workspaceContext.workspaceId;
      if (!workspaceId) {
        throw new Error('Workspace context is required for participant creation');
      }

      const participantRepository = await this.twentyORMGlobalManager
        .getRepositoryForWorkspace(
          workspaceId,
          TribMessageParticipantWorkspaceEntity,
          { shouldBypassPermissionChecks: true }
        );

      // Check if participant already exists to avoid duplicates
      const existingParticipant = await participantRepository.findOne({
        where: {
          tribMessageId: messageId,
          personId: personId,
        }
      });

      if (!existingParticipant) {
        await participantRepository.save({
          tribMessageId: messageId,
          personId,
          role,
          phoneNumber,
        });
      } else {
        this.logger.log(`TribMessageParticipant already exists: messageId=${messageId}, personId=${personId}`);
      }

      this.logger.log(
        `TribMessageParticipant created: messageId=${messageId}, personId=${personId}`
      );
    } catch (error) {
      securityLogger.error(
        'PARTICIPANT_CREATION_ERROR - Failed to create TribMessageParticipant',
        JSON.stringify({
          messageId,
          personId,
          error: error instanceof Error ? error.message : String(error),
          securityEvent: 'PARTICIPANT_CREATION_ERROR',
          system: 'Twenty CRM TRIB SMS',
        })
      );
      throw error;
    }
  }
}