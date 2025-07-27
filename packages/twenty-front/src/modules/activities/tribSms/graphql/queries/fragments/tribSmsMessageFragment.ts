import { gql } from '@apollo/client';

export const tribSmsMessageFragment = gql`
  fragment TribSmsMessageFragment on TribSmsMessage {
    id
    role
    phoneNumber
    tribMessage {
      id
      content
      direction
      status
      timestamp
      externalId
    }
  }
`;