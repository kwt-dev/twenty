import { ApiKeyWorkspaceEntity } from 'src/modules/api-key/standard-objects/api-key.workspace-entity';
import { AttachmentWorkspaceEntity } from 'src/modules/attachment/standard-objects/attachment.workspace-entity';
import { BlocklistWorkspaceEntity } from 'src/modules/blocklist/standard-objects/blocklist.workspace-entity';
import { CalendarChannelEventAssociationWorkspaceEntity } from 'src/modules/calendar/common/standard-objects/calendar-channel-event-association.workspace-entity';
import { CalendarChannelWorkspaceEntity } from 'src/modules/calendar/common/standard-objects/calendar-channel.workspace-entity';
import { CalendarEventParticipantWorkspaceEntity } from 'src/modules/calendar/common/standard-objects/calendar-event-participant.workspace-entity';
import { CalendarEventWorkspaceEntity } from 'src/modules/calendar/common/standard-objects/calendar-event.workspace-entity';
import { CompanyWorkspaceEntity } from 'src/modules/company/standard-objects/company.workspace-entity';
import { ConnectedAccountWorkspaceEntity } from 'src/modules/connected-account/standard-objects/connected-account.workspace-entity';
import { FavoriteFolderWorkspaceEntity } from 'src/modules/favorite-folder/standard-objects/favorite-folder.workspace-entity';
import { FavoriteWorkspaceEntity } from 'src/modules/favorite/standard-objects/favorite.workspace-entity';
import { MessageChannelMessageAssociationWorkspaceEntity } from 'src/modules/messaging/common/standard-objects/message-channel-message-association.workspace-entity';
import { MessageChannelWorkspaceEntity } from 'src/modules/messaging/common/standard-objects/message-channel.workspace-entity';
import { MessageFolderWorkspaceEntity } from 'src/modules/messaging/common/standard-objects/message-folder.workspace-entity';
import { MessageParticipantWorkspaceEntity } from 'src/modules/messaging/common/standard-objects/message-participant.workspace-entity';
import { MessageThreadWorkspaceEntity } from 'src/modules/messaging/common/standard-objects/message-thread.workspace-entity';
import { MessageWorkspaceEntity } from 'src/modules/messaging/common/standard-objects/message.workspace-entity';
import { NoteTargetWorkspaceEntity } from 'src/modules/note/standard-objects/note-target.workspace-entity';
import { NoteWorkspaceEntity } from 'src/modules/note/standard-objects/note.workspace-entity';
import { OpportunityWorkspaceEntity } from 'src/modules/opportunity/standard-objects/opportunity.workspace-entity';
import { PersonWorkspaceEntity } from 'src/modules/person/standard-objects/person.workspace-entity';
import { TaskTargetWorkspaceEntity } from 'src/modules/task/standard-objects/task-target.workspace-entity';
import { TaskWorkspaceEntity } from 'src/modules/task/standard-objects/task.workspace-entity';
import { TimelineActivityWorkspaceEntity } from 'src/modules/timeline/standard-objects/timeline-activity.workspace-entity';
import { ViewFieldWorkspaceEntity } from 'src/modules/view/standard-objects/view-field.workspace-entity';
import { ViewFilterGroupWorkspaceEntity } from 'src/modules/view/standard-objects/view-filter-group.workspace-entity';
import { ViewFilterWorkspaceEntity } from 'src/modules/view/standard-objects/view-filter.workspace-entity';
import { ViewGroupWorkspaceEntity } from 'src/modules/view/standard-objects/view-group.workspace-entity';
import { ViewSortWorkspaceEntity } from 'src/modules/view/standard-objects/view-sort.workspace-entity';
import { ViewWorkspaceEntity } from 'src/modules/view/standard-objects/view.workspace-entity';
import { WebhookWorkspaceEntity } from 'src/modules/webhook/standard-objects/webhook.workspace-entity';
import { WorkflowAutomatedTriggerWorkspaceEntity } from 'src/modules/workflow/common/standard-objects/workflow-automated-trigger.workspace-entity';
import { WorkflowRunWorkspaceEntity } from 'src/modules/workflow/common/standard-objects/workflow-run.workspace-entity';
import { WorkflowVersionWorkspaceEntity } from 'src/modules/workflow/common/standard-objects/workflow-version.workspace-entity';
import { WorkflowWorkspaceEntity } from 'src/modules/workflow/common/standard-objects/workflow.workspace-entity';
import { WorkspaceMemberWorkspaceEntity } from 'src/modules/workspace-member/standard-objects/workspace-member.workspace-entity';
// TRIB entities with fixed SELECT field default values
import { TribConsentWorkspaceEntity } from 'src/modules/trib/standard-objects/trib-consent.workspace-entity';
import { TribDeliveryWorkspaceEntity } from 'src/modules/trib/standard-objects/trib-delivery.workspace-entity';
import { TribMessageWorkspaceEntity } from 'src/modules/trib/standard-objects/trib-message.workspace-entity';
import { TribPhoneNumberWorkspaceEntity } from 'src/modules/trib/standard-objects/trib-phone-number.workspace-entity';
import { TribThreadWorkspaceEntity } from 'src/modules/trib/standard-objects/trib-thread.workspace-entity';
import { TribMessageParticipantWorkspaceEntity } from 'src/modules/trib/standard-objects/trib-message-participant.workspace-entity';

// TODO: Maybe we should automate this with the DiscoverService of Nest.JS
export const standardObjectMetadataDefinitions = [
  AttachmentWorkspaceEntity,
  BlocklistWorkspaceEntity,
  CalendarEventWorkspaceEntity,
  CalendarChannelWorkspaceEntity,
  CalendarChannelEventAssociationWorkspaceEntity,
  CalendarEventParticipantWorkspaceEntity,
  CompanyWorkspaceEntity,
  ConnectedAccountWorkspaceEntity,
  FavoriteWorkspaceEntity,
  FavoriteFolderWorkspaceEntity,
  TimelineActivityWorkspaceEntity,
  ViewFieldWorkspaceEntity,
  ViewGroupWorkspaceEntity,
  ViewFilterWorkspaceEntity,
  ViewFilterGroupWorkspaceEntity,
  ViewSortWorkspaceEntity,
  ViewWorkspaceEntity,
  WorkflowWorkspaceEntity,
  WorkflowVersionWorkspaceEntity,
  WorkflowRunWorkspaceEntity,
  WorkflowAutomatedTriggerWorkspaceEntity,
  WorkspaceMemberWorkspaceEntity,
  MessageThreadWorkspaceEntity,
  MessageWorkspaceEntity,
  MessageChannelWorkspaceEntity,
  MessageParticipantWorkspaceEntity,
  MessageFolderWorkspaceEntity,
  MessageChannelMessageAssociationWorkspaceEntity,
  NoteWorkspaceEntity,
  NoteTargetWorkspaceEntity,
  OpportunityWorkspaceEntity,
  PersonWorkspaceEntity,
  TaskWorkspaceEntity,
  TaskTargetWorkspaceEntity,
  // Enable core TRIB entities together to resolve interdependencies
  TribConsentWorkspaceEntity,         // ✅ PHASE 3 - Fixed SELECT defaultValue issues
  TribDeliveryWorkspaceEntity,        // ✅ PHASE 2 - Fixed SELECT defaultValue issues
  TribPhoneNumberWorkspaceEntity, // ✅ PHASE 1 - Clean standalone entity
  TribThreadWorkspaceEntity,      // ✅ FIRST - No dependencies
  TribMessageWorkspaceEntity,     // ✅ SECOND - Depends on TribThread
  TribMessageParticipantWorkspaceEntity, // ✅ BRIDGE - Links TribMessage to Person
  ApiKeyWorkspaceEntity,
  WebhookWorkspaceEntity,
];
