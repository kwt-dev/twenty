import { Field, ObjectType } from '@nestjs/graphql';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

/**
 * TRIB Message DTO for GraphQL responses
 * 
 * Represents the core SMS message data needed by the frontend.
 * This maps to the TribMessage workspace entity but only includes
 * fields relevant for timeline/conversation display.
 */
@ObjectType()
export class TribMessageDto {
  @Field(() => UUIDScalarType)
  id: string;

  @Field()
  content: string;

  @Field()
  direction: string;

  @Field()
  status: string;

  @Field()
  timestamp: Date;

  @Field({ nullable: true })
  externalId?: string;
}

/**
 * TRIB SMS Message DTO for GraphQL responses
 * 
 * Represents a person's participation in an SMS conversation.
 * This maps to the TribMessageParticipant workspace entity and includes
 * the related TribMessage data for complete conversation context.
 * 
 * Used by the getTribSmsMessagesFromPersonId resolver to provide
 * all SMS conversations for a specific person.
 */
@ObjectType()
export class TribSmsMessage {
  @Field(() => UUIDScalarType)
  id: string;

  /**
   * Participant role in the SMS conversation
   * - 'from': This participant sent the message
   * - 'to': This participant received the message
   */
  @Field()
  role: string;

  /**
   * Phone number of the participant in E.164 format
   */
  @Field()
  phoneNumber: string;

  /**
   * Related SMS message content and metadata
   */
  @Field(() => TribMessageDto)
  tribMessage: TribMessageDto;
}