import { gql } from '@apollo/client';
import { tribSmsMessageFragment } from '@/activities/tribSms/graphql/queries/fragments/tribSmsMessageFragment';

export const tribSmsMessageWithTotalFragment = gql`
  fragment TribSmsMessagesWithTotalFragment on TribSmsMessagesWithTotal {
    totalNumberOfMessages
    tribSmsMessages {
      ...TribSmsMessageFragment
    }
  }
  ${tribSmsMessageFragment}
`;