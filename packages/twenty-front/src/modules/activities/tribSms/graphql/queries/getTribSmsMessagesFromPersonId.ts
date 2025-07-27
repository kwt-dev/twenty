import { gql } from '@apollo/client';
import { tribSmsMessageWithTotalFragment } from '@/activities/tribSms/graphql/queries/fragments/tribSmsMessageWithTotalFragment';

export const getTribSmsMessagesFromPersonId = gql`
  query GetTribSmsMessagesFromPersonId(
    $personId: UUID!
    $page: Int!
    $pageSize: Int!
  ) {
    getTribSmsMessagesFromPersonId(
      personId: $personId
      page: $page
      pageSize: $pageSize
    ) {
      ...TribSmsMessagesWithTotalFragment
    }
  }
  ${tribSmsMessageWithTotalFragment}
`;