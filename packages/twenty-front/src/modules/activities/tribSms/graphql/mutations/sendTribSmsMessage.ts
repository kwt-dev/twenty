import { gql } from "@apollo/client";

export const SEND_TRIB_SMS_MESSAGE = gql`
  mutation SendTribSmsMessage($personId: UUID!, $message: String!) {
    sendTribSmsMessage(personId: $personId, message: $message)
  }
`;