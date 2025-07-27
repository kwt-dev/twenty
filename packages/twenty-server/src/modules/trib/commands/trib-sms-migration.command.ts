import { InjectRepository } from '@nestjs/typeorm';
import { Logger } from '@nestjs/common';
import { Command, CommandRunner, Option } from 'nest-commander';
import { Repository } from 'typeorm';

import { Workspace } from 'src/engine/core-modules/workspace/workspace.entity';
import { WorkspaceActivationStatus } from 'twenty-shared/workspace';
import { ScopedWorkspaceContextFactory } from 'src/engine/twenty-orm/factories/scoped-workspace-context.factory';
import { TwentyORMGlobalManager } from 'src/engine/twenty-orm/twenty-orm-global.manager';
import { TribDataMigrationService } from 'src/modules/trib/services/trib-data-migration.service';

interface TribSmsCommandOptions {
  workspaceId?: string;
  dryRun?: boolean;
  batchSize?: number;
  status?: boolean;
}

/**
 * TRIB SMS Migration Command
 * 
 * Command-line tool for migrating existing SMS data to support the new
 * Person-SMS bridge architecture. This command creates TribMessageParticipant
 * records for existing TribMessage records, enabling SMS messages to appear
 * in Person contact tabs.
 * 
 * Usage:
 * ```bash
 * # Migrate all workspaces
 * npm run command:dev trib:migrate-sms
 * 
 * # Migrate specific workspace
 * npm run command:dev trib:migrate-sms --workspaceId=<uuid>
 * 
 * # Dry run to see what would be migrated
 * npm run command:dev trib:migrate-sms --dryRun
 * 
 * # Check migration status
 * npm run command:dev trib:migrate-sms --status
 * 
 * # Custom batch size
 * npm run command:dev trib:migrate-sms --batchSize=50
 * ```
 */
@Command({
  name: 'trib:migrate-sms',
  description: 'Migrate existing TRIB SMS data to Person-SMS bridge architecture',
})
export class TribSmsMigrationCommand extends CommandRunner {
  private readonly logger = new Logger(TribSmsMigrationCommand.name);

  constructor(
    @InjectRepository(Workspace, 'core')
    private readonly workspaceRepository: Repository<Workspace>,
    private readonly twentyORMGlobalManager: TwentyORMGlobalManager,
    private readonly scopedWorkspaceContextFactory: ScopedWorkspaceContextFactory,
  ) {
    super();
  }

  async run(
    passedParams: string[],
    options: TribSmsCommandOptions,
  ): Promise<void> {
    if (options.status) {
      await this.showMigrationStatus(options.workspaceId);
      return;
    }

    if (options.dryRun) {
      this.logger.log('🔍 DRY RUN MODE - No data will be modified');
    }

    if (options.workspaceId) {
      await this.migrateWorkspace(options.workspaceId, options);
    } else {
      await this.migrateAllWorkspaces(options);
    }
  }

  @Option({
    flags: '-w, --workspaceId <workspaceId>',
    description: 'Target specific workspace ID',
  })
  parseWorkspaceId(value: string): string {
    return value;
  }

  @Option({
    flags: '-d, --dryRun',
    description: 'Show what would be migrated without making changes',
  })
  parseDryRun(): boolean {
    return true;
  }

  @Option({
    flags: '-b, --batchSize <batchSize>',
    description: 'Number of messages to process per batch (default: 100)',
  })
  parseBatchSize(value: string): number {
    const parsed = parseInt(value, 10);
    if (isNaN(parsed) || parsed < 1) {
      throw new Error('Batch size must be a positive number');
    }
    return parsed;
  }

  @Option({
    flags: '-s, --status',
    description: 'Show current migration status without running migration',
  })
  parseStatus(): boolean {
    return true;
  }

  /**
   * Migrate all active workspaces
   * @private
   */
  private async migrateAllWorkspaces(options: TribSmsCommandOptions): Promise<void> {
    const workspaces = await this.workspaceRepository.find({
      where: { activationStatus: WorkspaceActivationStatus.ACTIVE },
    });

    this.logger.log(`🚀 Starting SMS migration for ${workspaces.length} workspaces`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < workspaces.length; i++) {
      const workspace = workspaces[i];
      this.logger.log(`\n📱 Processing workspace ${i + 1}/${workspaces.length}: ${workspace.displayName} (${workspace.id})`);

      try {
        await this.migrateWorkspace(workspace.id, options);
        successCount++;
      } catch (error) {
        this.logger.error(`❌ Failed to migrate workspace ${workspace.id}: ${error.message}`);
        errorCount++;
      }
    }

    this.logger.log(`\n✅ Migration completed: ${successCount} successful, ${errorCount} errors`);
  }

  /**
   * Migrate a specific workspace
   * @private
   */
  private async migrateWorkspace(
    workspaceId: string,
    options: TribSmsCommandOptions,
  ): Promise<void> {
    // Create workspace context
    const context = this.scopedWorkspaceContextFactory.create();
    
    // Create migration service instance with workspace context
    const migrationService = new TribDataMigrationService(
      this.twentyORMGlobalManager,
      this.scopedWorkspaceContextFactory,
    );

    if (options.dryRun) {
      const status = await migrationService.getMigrationStatus();
      this.logger.log(`📊 Migration status for workspace ${workspaceId}:`);
      this.logger.log(`  - Total SMS messages: ${status.totalMessages}`);
      this.logger.log(`  - Messages without participants: ${status.messagesWithoutParticipants}`);
      this.logger.log(`  - Would create ${status.messagesWithoutParticipants * 2} participant records`);
      return;
    }

    // Run actual migration
    const batchSize = options.batchSize || 100;
    const result = await migrationService.migrateExistingSmsMessages(batchSize);

    this.logger.log(`📊 Migration results for workspace ${workspaceId}:`);
    this.logger.log(`  - Total messages processed: ${result.totalMessages}`);
    this.logger.log(`  - Participants created: ${result.participantsCreated}`);
    this.logger.log(`  - Messages linked to persons: ${result.personsLinked}`);
    this.logger.log(`  - Unlinked messages: ${result.unlinkedMessages}`);
    
    if (result.errors.length > 0) {
      this.logger.warn(`  - Errors encountered: ${result.errors.length}`);
      result.errors.forEach(error => this.logger.warn(`    ${error}`));
    }
  }

  /**
   * Show migration status for workspace(s)
   * @private
   */
  private async showMigrationStatus(workspaceId?: string): Promise<void> {
    if (workspaceId) {
      await this.showWorkspaceMigrationStatus(workspaceId);
    } else {
      await this.showAllWorkspacesMigrationStatus();
    }
  }

  /**
   * Show migration status for a specific workspace
   * @private
   */
  private async showWorkspaceMigrationStatus(workspaceId: string): Promise<void> {
    const context = this.scopedWorkspaceContextFactory.create();
    
    const migrationService = new TribDataMigrationService(
      this.twentyORMGlobalManager,
      this.scopedWorkspaceContextFactory,
    );

    const status = await migrationService.getMigrationStatus();

    this.logger.log(`📊 SMS Migration Status for workspace ${workspaceId}:`);
    this.logger.log(`  - Total SMS messages: ${status.totalMessages}`);
    this.logger.log(`  - Messages with participants: ${status.messagesWithParticipants}`);
    this.logger.log(`  - Messages without participants: ${status.messagesWithoutParticipants}`);
    this.logger.log(`  - Total participants: ${status.totalParticipants}`);
    this.logger.log(`  - Participants linked to persons: ${status.participantsWithPersons}`);
    this.logger.log(`  - Participants without persons: ${status.participantsWithoutPersons}`);

    const migrationComplete = status.messagesWithoutParticipants === 0;
    this.logger.log(`  - Migration status: ${migrationComplete ? '✅ Complete' : '⏳ Incomplete'}`);
  }

  /**
   * Show migration status for all workspaces
   * @private
   */
  private async showAllWorkspacesMigrationStatus(): Promise<void> {
    const workspaces = await this.workspaceRepository.find({
      where: { activationStatus: WorkspaceActivationStatus.ACTIVE },
      select: ['id', 'displayName'],
    });

    this.logger.log(`📊 SMS Migration Status Overview (${workspaces.length} workspaces):\n`);

    for (const workspace of workspaces) {
      try {
        const context = this.scopedWorkspaceContextFactory.create();
        
        const migrationService = new TribDataMigrationService(
          this.twentyORMGlobalManager,
          this.scopedWorkspaceContextFactory,
        );

        const status = await migrationService.getMigrationStatus();
        const migrationComplete = status.messagesWithoutParticipants === 0;
        
        this.logger.log(
          `${migrationComplete ? '✅' : '⏳'} ${workspace.displayName}: ` +
          `${status.totalMessages} messages, ` +
          `${status.messagesWithoutParticipants} pending migration`
        );
      } catch (error) {
        this.logger.error(`❌ ${workspace.displayName}: Error checking status - ${error.message}`);
      }
    }
  }
}