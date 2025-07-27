import { Module } from '@nestjs/common';
import { TwentyORMModule } from 'src/engine/twenty-orm/twenty-orm.module';
import { ModulesModule } from 'src/modules/modules.module';
import { TribSmsTimelineResolver } from 'src/modules/trib/resolvers/trib-sms-timeline.resolver';
import { TribSmsTimelineService } from 'src/modules/trib/services/trib-sms-timeline.service';
import { TribDataMigrationService } from 'src/modules/trib/services/trib-data-migration.service';

/**
 * TRIB Timeline Module
 *
 * Provides GraphQL resolvers and services for retrieving SMS conversations
 * in timeline format. This module follows Twenty's established pattern for
 * timeline modules (calendar, messaging) to provide consistent API design.
 *
 * Features:
 * - Custom GraphQL resolvers for SMS message retrieval
 * - Pagination support for infinite scroll in frontend
 * - Workspace-scoped data access
 * - Person and Company-level SMS conversations
 *
 * Integration:
 * This module works with the existing TRIB workspace entities and services
 * but provides additional GraphQL endpoints specifically designed for
 * Twenty's frontend timeline components.
 */
@Module({
  imports: [TwentyORMModule, ModulesModule],
  providers: [
    TribSmsTimelineResolver,
    TribSmsTimelineService,
    TribDataMigrationService,
  ],
  exports: [TribSmsTimelineService, TribDataMigrationService],
})
export class TribTimelineModule {}
