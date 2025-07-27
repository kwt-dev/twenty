import styled from '@emotion/styled';
import { H1Title, H1TitleFontColor } from 'twenty-ui/display';

const StyledMessagePreview = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2)};
  padding: ${({ theme }) => theme.spacing(3)};
  border: 1px solid ${({ theme }) => theme.border.color.medium};
  border-radius: ${({ theme }) => theme.border.radius.md};
  background: ${({ theme }) => theme.background.secondary};
`;

const StyledMessageList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1)};
`;

const StyledMessage = styled.div<{ isOutbound: boolean }>`
  padding: ${({ theme }) => theme.spacing(2)};
  border-radius: ${({ theme }) => theme.border.radius.sm};
  background: ${({ theme, isOutbound }) => 
    isOutbound ? theme.color.blue : theme.background.tertiary};
  color: ${({ theme, isOutbound }) => 
    isOutbound ? theme.color.gray80 : theme.font.color.primary};
  max-width: 80%;
  align-self: ${({ isOutbound }) => isOutbound ? 'flex-end' : 'flex-start'};
`;

const StyledMessageMeta = styled.div`
  font-size: ${({ theme }) => theme.font.size.xs};
  color: ${({ theme }) => theme.font.color.tertiary};
  margin-top: ${({ theme }) => theme.spacing(1)};
`;

type TribSmsMessagePreviewProps = {
  messageThread: {
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
};

export const TribSmsMessagePreview = ({ 
  messageThread 
}: TribSmsMessagePreviewProps) => {
  const sortedMessages = [...messageThread.messages].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return (
    <StyledMessagePreview>
      <H1Title fontColor={H1TitleFontColor.Primary} title={messageThread.phoneNumber} />
      <StyledMessageList>
        {sortedMessages.slice(0, 3).map((message) => (
          <StyledMessage
            key={message.id}
            isOutbound={message.direction === 'OUTBOUND'}
          >
            <div>{message.content}</div>
            <StyledMessageMeta>
              {new Date(message.timestamp).toLocaleString()} • {message.status}
            </StyledMessageMeta>
          </StyledMessage>
        ))}
        {sortedMessages.length > 3 && (
          <StyledMessageMeta>
            +{sortedMessages.length - 3} more messages
          </StyledMessageMeta>
        )}
      </StyledMessageList>
    </StyledMessagePreview>
  );
};