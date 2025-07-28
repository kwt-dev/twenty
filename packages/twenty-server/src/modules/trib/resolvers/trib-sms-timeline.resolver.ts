import { UseGuards, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { Args, ArgsType, Field, Int, Query, Resolver, Mutation } from '@nestjs/graphql';
import { Max, IsNotEmpty, MaxLength } from 'class-validator';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';
import { AuthWorkspaceMemberId } from 'src/engine/decorators/auth/auth-workspace-member-id.decorator';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { Workspace } from 'src/engine/core-modules/workspace/workspace.entity';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { TribSmsMessagesWithTotal } from 'src/modules/trib/dtos/trib-sms-messages-with-total.dto';
import { TribSmsTimelineService } from 'src/modules/trib/services/trib-sms-timeline.service';
import { TribSmsService, CreateSmsMessageDto, TwilioConfigDto, TribMessageChannel, TribMessageDirection, TribMessagePriority } from '@twenty/trib-messages-module';
import { TribWorkspaceService } from 'src/modules/trib/services/trib-workspace.service';

// Maximum page size to prevent performance issues
const TRIB_SMS_MESSAGES_MAX_PAGE_SIZE = 50;

/**
 * GraphQL arguments for getting SMS messages from a person ID
 */
@ArgsType()
class GetTribSmsMessagesFromPersonIdArgs {
  @Field(() => UUIDScalarType)
  personId: string;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  @Max(TRIB_SMS_MESSAGES_MAX_PAGE_SIZE)
  pageSize: number;
}

/**
 * GraphQL arguments for getting SMS messages from a company ID
 * Future implementation for company-level SMS conversations
 */
@ArgsType()
class GetTribSmsMessagesFromCompanyIdArgs {
  @Field(() => UUIDScalarType)
  companyId: string;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  @Max(TRIB_SMS_MESSAGES_MAX_PAGE_SIZE)
  pageSize: number;
}

/**
 * GraphQL arguments for sending SMS message to a person
 */
@ArgsType()
class SendTribSmsMessageArgs {
  @Field(() => UUIDScalarType)
  personId: string;

  @Field(() => String)
  @IsNotEmpty()
  @MaxLength(1600)
  message: string;
}

/**
 * TRIB SMS Timeline Resolver
 * 
 * Provides GraphQL queries for retrieving SMS conversations in timeline format.
 * Follows Twenty's established patterns used by calendar and messaging modules
 * for consistent API design and frontend integration.
 * 
 * Features:
 * - Workspace-scoped SMS message retrieval
 * - Pagination support for infinite scroll
 * - Person and Company-level SMS conversations
 * - Proper authentication and authorization
 * 
 * @example Frontend Usage:
 * ```typescript
 * const { data } = useCustomResolver({
 *   query: getTribSmsMessagesFromPersonId,
 *   queryName: 'getTribSmsMessagesFromPersonId',
 *   objectName: 'tribSmsMessages',
 *   activityTargetableObject: targetableObject,
 *   pageSize: 20,
 * });
 * ```
 */
@UseGuards(WorkspaceAuthGuard)
@Resolver(() => TribSmsMessagesWithTotal)
export class TribSmsTimelineResolver {
  constructor(
    private readonly tribSmsTimelineService: TribSmsTimelineService,
    private readonly tribSmsService: TribSmsService,
    private readonly tribWorkspaceService: TribWorkspaceService,
  ) {}

  /**
   * Get SMS messages for a specific person with pagination
   * 
   * This query enables SMS conversations to appear in Person contact tabs
   * alongside emails and calendar events, providing a unified communication view.
   * 
   * @param args - Person ID and pagination parameters
   * @param workspaceMemberId - Current workspace member ID for authentication
   * @returns Paginated SMS messages with total count
   */
  @Query(() => TribSmsMessagesWithTotal)
  async getTribSmsMessagesFromPersonId(
    @Args() { personId, page, pageSize }: GetTribSmsMessagesFromPersonIdArgs,
    @AuthWorkspaceMemberId() workspaceMemberId: string,
  ): Promise<TribSmsMessagesWithTotal> {
    const tribSmsMessages = await this.tribSmsTimelineService
      .getSmsMessagesFromPersonId({
        currentWorkspaceMemberId: workspaceMemberId,
        personId,
        page,
        pageSize,
      });

    return tribSmsMessages;
  }

  /**
   * Get SMS messages for a specific company with pagination
   * 
   * Future implementation for company-level SMS conversations.
   * This would aggregate SMS messages from all persons associated with a company.
   * 
   * @param args - Company ID and pagination parameters
   * @param workspaceMemberId - Current workspace member ID for authentication
   * @returns Paginated SMS messages with total count
   */
  @Query(() => TribSmsMessagesWithTotal)
  async getTribSmsMessagesFromCompanyId(
    @Args() { companyId, page, pageSize }: GetTribSmsMessagesFromCompanyIdArgs,
    @AuthWorkspaceMemberId() workspaceMemberId: string,
  ): Promise<TribSmsMessagesWithTotal> {
    const tribSmsMessages = await this.tribSmsTimelineService
      .getSmsMessagesFromCompanyId({
        currentWorkspaceMemberId: workspaceMemberId,
        companyId,
        page,
        pageSize,
      });

    return tribSmsMessages;
  }

  /**
   * Send SMS message to a person
   * 
   * This mutation enables sending SMS messages from the Twenty CRM interface.
   * It looks up the person's phone number, constructs the SMS message DTO,
   * and sends it via the TribSmsService.
   * 
   * @param args - Person ID and message content
   * @param workspace - Current workspace for authentication and scoping
   * @returns Boolean indicating success
   */
  @Mutation(() => Boolean)
  async sendTribSmsMessage(
    @Args() { personId, message }: SendTribSmsMessageArgs,
    @AuthWorkspace() { id: workspaceId }: Workspace,
  ): Promise<boolean> {
    try {
      // Step 1: Get person's phone number
      const recipientPhone = await this.tribWorkspaceService.findPhoneByPersonId(personId);
      if (!recipientPhone) {
        throw new NotFoundException(
          `Person ${personId} does not have a primary phone number`
        );
      }

      // Step 2: Build CreateSmsMessageDto
      const messageDto: CreateSmsMessageDto = {
        content: message.trim(),
        channel: TribMessageChannel.SMS,
        to: recipientPhone,
        from: process.env.TWILIO_PHONE_NUMBER!,
        workspaceId: workspaceId,
        direction: TribMessageDirection.OUTBOUND,
        priority: TribMessagePriority.NORMAL,
        contactId: personId, // Add personId for participant linking
      };

      // Step 3: Build TwilioConfigDto from environment
      const twilioConfig: TwilioConfigDto = {
        accountSid: process.env.TWILIO_ACCOUNT_SID!,
        authToken: process.env.TWILIO_AUTH_TOKEN!,
        phoneNumber: process.env.TWILIO_PHONE_NUMBER!,
        timeout: 30000,
        maxRetries: 3,
      };

      // Step 4: Send message via TribSmsService
      const result = await this.tribSmsService.sendMessage(messageDto, twilioConfig);

      if (!result.success) {
        throw new BadRequestException(
          `Failed to send SMS: ${result.error || 'Unknown error'}`
        );
      }

      return true;
    } catch (error) {
      // Re-throw GraphQL-friendly errors
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to send SMS message');
    }
  }
}