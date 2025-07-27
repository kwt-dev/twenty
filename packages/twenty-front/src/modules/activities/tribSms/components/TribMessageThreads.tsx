import styled from '@emotion/styled';
import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { ActivityList } from '@/activities/components/ActivityList';
import { CustomResolverFetchMoreLoader } from '@/activities/components/CustomResolverFetchMoreLoader';
import { SkeletonLoader } from '@/activities/components/SkeletonLoader';
import { TribSmsMessagePreview } from '@/activities/tribSms/components/TribSmsMessagePreview';
import { TRIB_SMS_MESSAGES_DEFAULT_PAGE_SIZE } from '@/activities/tribSms/constants/TribSmsMessaging';
import { getTribSmsMessagesFromPersonId } from '@/activities/tribSms/graphql/queries/getTribSmsMessagesFromPersonId';
import { SEND_TRIB_SMS_MESSAGE } from '@/activities/tribSms/graphql/mutations/sendTribSmsMessage';
import { useCustomResolver } from '@/activities/hooks/useCustomResolver';
import { ActivityTargetableObject } from '@/activities/types/ActivityTargetableEntity';
import { CoreObjectNameSingular } from '@/object-metadata/types/CoreObjectNameSingular';
import { TextArea } from '@/ui/input/components/TextArea';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import {
  AnimatedPlaceholder,
  AnimatedPlaceholderEmptyContainer,
  AnimatedPlaceholderEmptySubTitle,
  AnimatedPlaceholderEmptyTextContainer,
  AnimatedPlaceholderEmptyTitle,
  EMPTY_PLACEHOLDER_TRANSITION_PROPS,
  Section,
} from 'twenty-ui/layout';
import { H1Title, H1TitleFontColor } from 'twenty-ui/display';
import { Button } from 'twenty-ui/input';

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(6)};
  padding: ${({ theme }) => theme.spacing(6, 6, 2)};
  height: 100%;
  overflow: auto;
`;

const StyledSmsCount = styled.span`
  color: ${({ theme }) => theme.font.color.light};
`;

const StyledChatInputContainer = styled.div`
  margin-top: ${({ theme }) => theme.spacing(4)};
  padding: ${({ theme }) => theme.spacing(4)};
  border-top: 1px solid ${({ theme }) => theme.border.color.medium};
  background-color: ${({ theme }) => theme.background.secondary};
`;

const StyledButtonContainer = styled.div`
  margin-top: ${({ theme }) => theme.spacing(2)};
  display: flex;
  justify-content: flex-end;
`;

const SMS_CHAR_LIMIT = 1600;

const StyledCharacterCounter = styled.div<{ $isOverLimit: boolean }>`
  font-size: ${({ theme }) => theme.font.size.xs};
  color: ${({ theme, $isOverLimit }) => 
    $isOverLimit ? theme.color.red : theme.font.color.light};
  text-align: right;
  margin-top: ${({ theme }) => theme.spacing(1)};
`;

type MessageThread = {
  phoneNumber: string;
  messages: Array<{
    id: string;
    content: string;
    direction: string;
    status: string;
    timestamp: string;
    role: string;
  }>;
};

const groupMessagesByPhoneNumber = (participants: any[]): MessageThread[] => {
  const threads = new Map<string, MessageThread>();
  
  participants.forEach(participant => {
    const phoneNumber = participant.phoneNumber;
    if (!threads.has(phoneNumber)) {
      threads.set(phoneNumber, {
        phoneNumber,
        messages: [],
      });
    }
    threads.get(phoneNumber)!.messages.push({
      ...participant.tribMessage,
      role: participant.role,
    });
  });
  
  return Array.from(threads.values());
};

export const TribMessageThreads = ({
  targetableObject,
}: {
  targetableObject: ActivityTargetableObject;
}) => {
  // ✅ CORRECT: Use Twenty's useCustomResolver pattern like EmailThreads
  const [query, queryName] =
    targetableObject.targetObjectNameSingular === CoreObjectNameSingular.Person
      ? [getTribSmsMessagesFromPersonId, 'getTribSmsMessagesFromPersonId']
      : [null, ''];

  const {
    data,
    firstQueryLoading,
    isFetchingMore,
    fetchMoreRecords,
  } = useCustomResolver(
    query!,
    queryName,
    'tribSmsMessages',
    targetableObject,
    TRIB_SMS_MESSAGES_DEFAULT_PAGE_SIZE,
  );

  const smsMessages = data?.[queryName]?.tribSmsMessages || [];
  const totalCount = data?.[queryName]?.totalNumberOfMessages || 0;

  // Phase 2: Chat input state and GraphQL mutation
  const [draftMessage, setDraftMessage] = useState('');
  const { enqueueSuccessSnackBar, enqueueErrorSnackBar } = useSnackBar();

  const [sendTribSmsMessage, { loading: sendingMessage }] = useMutation(
    SEND_TRIB_SMS_MESSAGE,
    {
      // ✅ Use Twenty CRM's standard refetchQueries pattern
      refetchQueries: [
        {
          query: getTribSmsMessagesFromPersonId,
          variables: {
            personId: targetableObject.id,
            page: 1,
            pageSize: 20,
          },
        },
      ],
      awaitRefetchQueries: true,
      onCompleted: () => {
        enqueueSuccessSnackBar({ message: "Message sent successfully!" });
        setDraftMessage("");
      },
      onError: (error) => {
        // Enhanced error handling for missing phone numbers
        const errorMessage = error.message;
        if (errorMessage.includes("does not have a primary phone number")) {
          enqueueErrorSnackBar({
            message:
              "Cannot send SMS: This contact does not have a phone number. Please add a phone number to their profile first.",
          });
        } else {
          enqueueErrorSnackBar({ apolloError: error });
        }
      },
    }
  );

  const handleSendMessage = async () => {
    if (!draftMessage.trim() || sendingMessage) return;

    await sendTribSmsMessage({
      variables: {
        personId: targetableObject.id,
        message: draftMessage.trim(),
      },
    });
  };

  // Group messages by phone number for threading
  const messageThreads = groupMessagesByPhoneNumber(smsMessages);

  // ✅ CORRECT: Use Twenty's SkeletonLoader for consistency
  if (firstQueryLoading) {
    return <SkeletonLoader />;
  }

  // ✅ CORRECT: Use Twenty's AnimatedPlaceholder for empty states
  if (messageThreads.length === 0) {
    return (
      <AnimatedPlaceholderEmptyContainer
        {...EMPTY_PLACEHOLDER_TRANSITION_PROPS}
      >
        <AnimatedPlaceholder type="noMatchRecord" />
        <AnimatedPlaceholderEmptyTextContainer>
          <AnimatedPlaceholderEmptyTitle>
            No text messages found
          </AnimatedPlaceholderEmptyTitle>
          <AnimatedPlaceholderEmptySubTitle>
            Text messages will appear here when available
          </AnimatedPlaceholderEmptySubTitle>
        </AnimatedPlaceholderEmptyTextContainer>
      </AnimatedPlaceholderEmptyContainer>
    );
  }

  return (
    <StyledContainer>
      <Section>
        {/* ✅ CORRECT: Use Twenty's H1Title with count like EmailThreads */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <H1Title fontColor={H1TitleFontColor.Primary} title="Text Messages" />
          <StyledSmsCount>({totalCount})</StyledSmsCount>
        </div>
        {/* ✅ CORRECT: Use ActivityList for consistent rendering */}
        <ActivityList>
          {messageThreads.map((thread) => (
            <TribSmsMessagePreview 
              key={thread.phoneNumber} 
              messageThread={thread}
            />
          ))}
        </ActivityList>
        {/* ✅ CORRECT: Use CustomResolverFetchMoreLoader for pagination */}
        <CustomResolverFetchMoreLoader
          loading={isFetchingMore}
          onLastRowVisible={fetchMoreRecords}
        />

        {/* Chat Input Section */}
        <StyledChatInputContainer>
          <TextArea
            textAreaId="sms-draft-input"
            placeholder="Type your message... (max 1600 characters)"
            value={draftMessage}
            onChange={setDraftMessage}
            minRows={2}
            maxRows={4}
          />
          
          {/* Character Counter */}
          <StyledCharacterCounter $isOverLimit={draftMessage.length > SMS_CHAR_LIMIT}>
            {draftMessage.length} / {SMS_CHAR_LIMIT}
          </StyledCharacterCounter>

          <StyledButtonContainer>
            <Button
              onClick={handleSendMessage}
              disabled={
                !draftMessage.trim() ||
                sendingMessage ||
                draftMessage.length > SMS_CHAR_LIMIT
              }
              variant="primary"
              title={sendingMessage ? "Sending..." : "Send Message"}
            />
          </StyledButtonContainer>
        </StyledChatInputContainer>
      </Section>
    </StyledContainer>
  );
};