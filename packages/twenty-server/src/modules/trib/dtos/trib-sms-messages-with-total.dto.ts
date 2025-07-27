import { Field, Int, ObjectType } from '@nestjs/graphql';

import { TribSmsMessage } from './trib-sms-message.dto';

/**
 * GraphQL response type for paginated TRIB SMS messages
 * 
 * Follows Twenty's standard pagination pattern used by calendar and messaging modules.
 * Returns both the total count and the current page of SMS messages for efficient
 * infinite scroll pagination in the frontend.
 * 
 * @example
 * ```graphql
 * query GetTribSmsMessagesFromPersonId($personId: UUID!, $page: Int!, $pageSize: Int!) {
 *   getTribSmsMessagesFromPersonId(personId: $personId, page: $page, pageSize: $pageSize) {
 *     totalNumberOfMessages
 *     tribSmsMessages {
 *       id
 *       role
 *       phoneNumber
 *       tribMessage {
 *         id
 *         content
 *         direction
 *         status
 *         timestamp
 *       }
 *     }
 *   }
 * }
 * ```
 */
@ObjectType()
export class TribSmsMessagesWithTotal {
  /**
   * Total number of SMS messages for this person
   * Used by frontend for pagination UI and infinite scroll
   */
  @Field(() => Int)
  totalNumberOfMessages: number;

  /**
   * Array of TRIB SMS message participants for current page
   * Each participant represents a person's involvement in an SMS conversation
   */
  @Field(() => [TribSmsMessage])
  tribSmsMessages: TribSmsMessage[];
}