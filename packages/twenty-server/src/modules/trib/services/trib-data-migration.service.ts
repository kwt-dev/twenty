import { Injectable, Logger } from '@nestjs/common';
import { Not, IsNull } from 'typeorm';

import { ScopedWorkspaceContextFactory } from 'src/engine/twenty-orm/factories/scoped-workspace-context.factory';
import { TwentyORMGlobalManager } from 'src/engine/twenty-orm/twenty-orm-global.manager';
import { TribMessageWorkspaceEntity } from 'src/modules/trib/standard-objects/trib-message.workspace-entity';
import { TribMessageParticipantWorkspaceEntity } from 'src/modules/trib/standard-objects/trib-message-participant.workspace-entity';
import { PersonWorkspaceEntity } from 'src/modules/person/standard-objects/person.workspace-entity';

/**
 * TRIB Data Migration Service
 * 
 * Handles migration of existing TRIB SMS data to support the new Person-SMS
 * bridge architecture. This service creates TribMessageParticipant records
 * for existing TribMessage records, enabling SMS messages to appear in
 * Person contact tabs.
 * 
 * Migration Tasks:
 * 1. Link existing SMS messages to Person records by phone number matching
 * 2. Create TribMessageParticipant bridge records for each SMS conversation
 * 3. Handle edge cases (multiple persons with same phone, missing persons)
 * 4. Provide progress reporting for large datasets
 */
@Injectable()
export class TribDataMigrationService {
  private readonly logger = new Logger(TribDataMigrationService.name);

  constructor(
    private readonly twentyORMGlobalManager: TwentyORMGlobalManager,
    private readonly scopedWorkspaceContextFactory: ScopedWorkspaceContextFactory,
  ) {}

  /**
   * Get workspace ID from current context
   * @private
   */
  private getWorkspaceId(): string {
    const { workspaceId } = this.scopedWorkspaceContextFactory.create();
    if (!workspaceId) {
      throw new Error('Workspace context is required for TRIB data migration');
    }
    return workspaceId;
  }

  /**
   * Migrate existing SMS messages to Person-SMS bridge architecture
   * 
   * This method processes all existing TribMessage records in batches,
   * creates corresponding TribMessageParticipant records, and links
   * them to Person records based on phone number matching.
   * 
   * @param batchSize - Number of messages to process per batch (default: 100)
   * @returns Migration statistics
   */
  async migrateExistingSmsMessages(batchSize = 100): Promise<{
    totalMessages: number;
    participantsCreated: number;
    personsLinked: number;
    unlinkedMessages: number;
    errors: string[];
  }> {
    const workspaceId = this.getWorkspaceId();
    
    this.logger.log(`Starting SMS data migration for workspace ${workspaceId}`);

    // Get repositories
    const messageRepository = await this.twentyORMGlobalManager
      .getRepositoryForWorkspace(workspaceId, TribMessageWorkspaceEntity);
    
    const participantRepository = await this.twentyORMGlobalManager
      .getRepositoryForWorkspace(workspaceId, TribMessageParticipantWorkspaceEntity);
    
    const personRepository = await this.twentyORMGlobalManager
      .getRepositoryForWorkspace(workspaceId, PersonWorkspaceEntity);

    // Get total count of messages
    const totalMessages = await messageRepository.count();
    this.logger.log(`Found ${totalMessages} SMS messages to migrate`);

    let processed = 0;
    let participantsCreated = 0;
    let personsLinked = 0;
    let unlinkedMessages = 0;
    const errors: string[] = [];

    // Process messages in batches
    while (processed < totalMessages) {
      try {
        // Get batch of messages that don't have participants yet
        const messages = await messageRepository
          .createQueryBuilder('message')
          .leftJoin('message.messageParticipants', 'participant')
          .where('participant.id IS NULL') // Only messages without participants
          .take(batchSize)
          .getMany();

        if (messages.length === 0) {
          this.logger.log('No more messages to process');
          break;
        }

        this.logger.log(`Processing batch: ${processed + 1}-${processed + messages.length} of ${totalMessages}`);

        // Process each message in the batch
        for (const message of messages) {
          try {
            const result = await this.processSingleMessage(
              message,
              participantRepository,
              personRepository,
            );
            
            participantsCreated += result.participantsCreated;
            if (result.personLinked) {
              personsLinked++;
            } else {
              unlinkedMessages++;
            }
          } catch (error) {
            const errorMsg = `Failed to process message ${message.id}: ${error.message}`;
            this.logger.error(errorMsg);
            errors.push(errorMsg);
          }
        }

        processed += messages.length;
        
        // Log progress
        this.logger.log(`Migration progress: ${processed}/${totalMessages} (${Math.round(processed / totalMessages * 100)}%)`);
        
      } catch (error) {
        const errorMsg = `Batch processing failed: ${error.message}`;
        this.logger.error(errorMsg);
        errors.push(errorMsg);
        break;
      }
    }

    const stats = {
      totalMessages,
      participantsCreated,
      personsLinked,
      unlinkedMessages,
      errors,
    };

    this.logger.log(`SMS migration completed:`, stats);
    return stats;
  }

  /**
   * Process a single SMS message and create participant records
   * @private
   */
  private async processSingleMessage(
    message: any,
    participantRepository: any,
    personRepository: any,
  ): Promise<{
    participantsCreated: number;
    personLinked: boolean;
  }> {
    let participantsCreated = 0;
    let personLinked = false;

    // Create participant for 'from' address
    if (message.from) {
      const fromPerson = await this.findPersonByPhoneNumber(message.from, personRepository);
      
      await participantRepository.save({
        tribMessageId: message.id,
        personId: fromPerson?.id || null,
        phoneNumber: this.normalizePhoneNumber(message.from),
        role: 'from',
      });
      
      participantsCreated++;
      if (fromPerson) personLinked = true;
    }

    // Create participant for 'to' address
    if (message.to) {
      const toPerson = await this.findPersonByPhoneNumber(message.to, personRepository);
      
      await participantRepository.save({
        tribMessageId: message.id,
        personId: toPerson?.id || null,
        phoneNumber: this.normalizePhoneNumber(message.to),
        role: 'to',
      });
      
      participantsCreated++;
      if (toPerson) personLinked = true;
    }

    return { participantsCreated, personLinked };
  }

  /**
   * Find a Person record by phone number
   * @private
   */
  private async findPersonByPhoneNumber(
    phoneNumber: string,
    personRepository: any,
  ): Promise<any | null> {
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
    if (!normalizedPhone) return null;

    // Try exact match first
    let person = await personRepository.findOne({
      where: { phone: normalizedPhone },
    });

    // If no exact match, try variations
    if (!person) {
      // Remove country code and try again
      const withoutCountryCode = normalizedPhone.replace(/^\+1/, '');
      person = await personRepository.findOne({
        where: { phone: withoutCountryCode },
      });
    }

    // Try with country code if original didn't have one
    if (!person && !normalizedPhone.startsWith('+')) {
      const withCountryCode = `+1${normalizedPhone}`;
      person = await personRepository.findOne({
        where: { phone: withCountryCode },
      });
    }

    return person;
  }

  /**
   * Normalize phone number to consistent format
   * @private
   */
  private normalizePhoneNumber(phoneNumber: string): string | null {
    if (!phoneNumber) return null;

    // Remove all non-digit characters
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    
    // If already has country code (11+ digits for US)
    if (digitsOnly.length >= 11) {
      return `+${digitsOnly}`;
    }
    
    // If 10 digits, assume US number
    if (digitsOnly.length === 10) {
      return `+1${digitsOnly}`;
    }
    
    // Return as-is if we can't normalize
    return phoneNumber;
  }

  /**
   * Get migration statistics without running migration
   * 
   * @returns Current state of SMS message migration
   */
  async getMigrationStatus(): Promise<{
    totalMessages: number;
    messagesWithParticipants: number;
    messagesWithoutParticipants: number;
    totalParticipants: number;
    participantsWithPersons: number;
    participantsWithoutPersons: number;
  }> {
    const workspaceId = this.getWorkspaceId();
    
    const messageRepository = await this.twentyORMGlobalManager
      .getRepositoryForWorkspace(workspaceId, TribMessageWorkspaceEntity);
    
    const participantRepository = await this.twentyORMGlobalManager
      .getRepositoryForWorkspace(workspaceId, TribMessageParticipantWorkspaceEntity);

    const [
      totalMessages,
      messagesWithParticipants,
      totalParticipants,
      participantsWithPersons,
    ] = await Promise.all([
      messageRepository.count(),
      messageRepository
        .createQueryBuilder('message')
        .innerJoin('message.messageParticipants', 'participant')
        .getCount(),
      participantRepository.count(),
      participantRepository.count({ where: { personId: Not(IsNull()) } }),
    ]);

    return {
      totalMessages,
      messagesWithParticipants,
      messagesWithoutParticipants: totalMessages - messagesWithParticipants,
      totalParticipants,
      participantsWithPersons,
      participantsWithoutPersons: totalParticipants - participantsWithPersons,
    };
  }
}