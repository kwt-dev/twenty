import { Injectable, Scope } from '@nestjs/common';

import { ScopedWorkspaceContextFactory } from 'src/engine/twenty-orm/factories/scoped-workspace-context.factory';
import { TwentyORMGlobalManager } from 'src/engine/twenty-orm/twenty-orm-global.manager';
import { TribMessageParticipantWorkspaceEntity } from 'src/modules/trib/standard-objects/trib-message-participant.workspace-entity';
import { TribSmsMessagesWithTotal } from 'src/modules/trib/dtos/trib-sms-messages-with-total.dto';
import {
  TribSmsMessage,
  TribMessageDto,
} from 'src/modules/trib/dtos/trib-sms-message.dto';

/**
 * Service for retrieving TRIB SMS messages in timeline format
 *
 * Provides paginated SMS conversation data for Person views, following
 * the same patterns as Twenty's calendar and messaging timeline services.
 *
 * Features:
 * - Workspace-scoped data access using ScopedWorkspaceContextFactory
 * - Efficient pagination with total count for infinite scroll
 * - Proper relationship loading for TribMessage data
 * - Request-scoped for workspace context isolation
 */
@Injectable({ scope: Scope.REQUEST })
export class TribSmsTimelineService {
  constructor(
    private readonly twentyORMGlobalManager: TwentyORMGlobalManager,
    private readonly scopedWorkspaceContextFactory: ScopedWorkspaceContextFactory,
  ) {}

  /**
   * Get workspace ID from current request context
   * @private
   */
  private async getWorkspaceId(): Promise<string> {
    const { workspaceId } = this.scopedWorkspaceContextFactory.create();
    if (!workspaceId) {
      throw new Error('Workspace context is required for TRIB SMS operations');
    }
    return workspaceId;
  }

  /**
   * Get SMS messages for a specific person with pagination
   *
   * @param currentWorkspaceMemberId - Current workspace member ID for authentication
   * @param personId - UUID of the person to get SMS messages for
   * @param page - Page number (1-based)
   * @param pageSize - Number of messages per page
   * @returns Paginated SMS messages with total count
   */
  async getSmsMessagesFromPersonId({
    currentWorkspaceMemberId,
    personId,
    page,
    pageSize,
  }: {
    currentWorkspaceMemberId: string;
    personId: string;
    page: number;
    pageSize: number;
  }): Promise<TribSmsMessagesWithTotal> {
    const { workspaceId } = this.scopedWorkspaceContextFactory.create();
    if (!workspaceId) {
      throw new Error('Workspace context is required for TRIB SMS operations');
    }

    // Get repository for TribMessageParticipant
    const participantRepository =
      await this.twentyORMGlobalManager.getRepositoryForWorkspace(
        workspaceId,
        TribMessageParticipantWorkspaceEntity,
      );

    // Calculate pagination offset
    const skip = (page - 1) * pageSize;

    // Use findAndCount instead of createQueryBuilder to work with Twenty's permission system
    // The workspace repository handles permissions automatically
    const [participants, totalCount] = await participantRepository.findAndCount(
      {
        where: {
          personId,
        },
        relations: {
          tribMessage: true,
        },
        skip,
        take: pageSize,
        order: {
          tribMessage: {
            timestamp: 'DESC',
          },
        },
      },
    );

    // Transform participants to DTO format
    const tribSmsMessages: TribSmsMessage[] = participants.map(
      (participant) => ({
        id: participant.id,
        role: participant.role,
        phoneNumber: participant.phoneNumber,
        tribMessage: this.transformTribMessageToDto(participant.tribMessage),
      }),
    );

    return {
      totalNumberOfMessages: totalCount,
      tribSmsMessages,
    };
  }

  /**
   * Transform TribMessage workspace entity to DTO
   * @private
   */
  private transformTribMessageToDto(tribMessage: any): TribMessageDto {
    return {
      id: tribMessage.id,
      content: tribMessage.content,
      direction: tribMessage.direction,
      status: tribMessage.status,
      timestamp: tribMessage.timestamp,
      externalId: tribMessage.externalId,
    };
  }

  /**
   * Get SMS messages for a specific company with pagination
   *
   * Future implementation for company-level SMS conversations
   * following the same pattern as calendar and messaging modules.
   *
   * @param currentWorkspaceMemberId - Current workspace member ID for authentication
   * @param companyId - UUID of the company to get SMS messages for
   * @param page - Page number (1-based)
   * @param pageSize - Number of messages per page
   * @returns Paginated SMS messages with total count
   */
  async getSmsMessagesFromCompanyId({
    currentWorkspaceMemberId,
    companyId,
    page,
    pageSize,
  }: {
    currentWorkspaceMemberId: string;
    companyId: string;
    page: number;
    pageSize: number;
  }): Promise<TribSmsMessagesWithTotal> {
    // TODO: Implement company-level SMS message retrieval
    // This would require linking SMS messages to companies via Person relationships
    // or creating direct company-SMS participant relationships

    return {
      totalNumberOfMessages: 0,
      tribSmsMessages: [],
    };
  }
}
