import { Module } from '@nestjs/common';

import { CalendarModule } from 'src/modules/calendar/calendar.module';
import { ConnectedAccountModule } from 'src/modules/connected-account/connected-account.module';
import { FavoriteFolderModule } from 'src/modules/favorite-folder/favorite-folder.module';
import { FavoriteModule } from 'src/modules/favorite/favorite.module';
import { MessagingModule } from 'src/modules/messaging/messaging.module';
import { ViewModule } from 'src/modules/view/view.module';
import { WorkflowModule } from 'src/modules/workflow/workflow.module';

import { TribMessagesModule, TRIB_TOKENS } from '@twenty/trib-messages-module';
import { RedisClientService } from 'src/engine/core-modules/redis-client/redis-client.service';
import { getQueueToken } from 'src/engine/core-modules/message-queue/utils/get-queue-token.util';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { ObjectMetadataModule } from 'src/engine/metadata-modules/object-metadata/object-metadata.module';
import { TribMessageWorkspaceRepository } from 'src/modules/trib/repositories/trib-message-workspace.repository';
import { TribWorkspaceService } from 'src/modules/trib/services/trib-workspace.service';
import { SmsQueueJob } from 'src/modules/trib/jobs/sms-queue.job';
import { WorkspaceEventEmitter } from 'src/engine/workspace-event-emitter/workspace-event-emitter';

@Module({
  imports: [
    MessagingModule,
    ObjectMetadataModule,
    TribMessagesModule.forRoot([
      // Override repository with workspace-aware implementation
      {
        provide: TRIB_TOKENS.MESSAGE_REPOSITORY,
        useClass: TribMessageWorkspaceRepository,
      },
      // Connect Twenty's Redis service
      {
        provide: TRIB_TOKENS.REDIS_CLIENT,
        useExisting: RedisClientService,
      },
      // Connect Twenty's message queue service
      {
        provide: TRIB_TOKENS.MESSAGE_QUEUE_SERVICE,
        useExisting: getQueueToken(MessageQueue.messagingQueue)
      },
      // Connect Twenty's Person repository for SMS phone matching
      {
        provide: TRIB_TOKENS.PERSON_REPOSITORY,
        useClass: TribWorkspaceService,
      },
      // Connect Twenty's WorkspaceEventEmitter for real-time events
      {
        provide: TRIB_TOKENS.WORKSPACE_EVENT_EMITTER,
        useExisting: WorkspaceEventEmitter,
      },
    ]),
    CalendarModule,
    ConnectedAccountModule,
    ViewModule,
    WorkflowModule,
    FavoriteFolderModule,
    FavoriteModule,
  ],
  providers: [
    TribMessageWorkspaceRepository,
    TribWorkspaceService, // Bridge service for Person-SMS linking
    SmsQueueJob, // Twenty-style SMS queue processor
  ],
  exports: [
    TribWorkspaceService, // Export for use by other modules
    TribMessagesModule, // Export configured TribMessagesModule for timeline module
  ],
})
export class ModulesModule {}
