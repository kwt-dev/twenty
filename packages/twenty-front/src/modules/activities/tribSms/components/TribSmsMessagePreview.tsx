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
  max-height: 400px;
  overflow-y: auto;
  padding: ${({ theme }) => theme.spacing(1)};
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

const StyledMessageMeta = styled.div<{ isOutbound?: boolean; status?: string }>`
  font-size: ${({ theme }) => theme.font.size.xs};
  color: ${({ theme, isOutbound }) => 
    isOutbound ? theme.color.gray50 : theme.font.color.tertiary};
  margin-top: ${({ theme }) => theme.spacing(1)};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const StyledDeliveryStatus = styled.span<{ status: string }>`
  font-size: ${({ theme }) => theme.font.size.xs};
  color: ${({ theme, status }) => {
    switch (status.toLowerCase()) {
      case 'delivered': return theme.color.green;
      case 'sent': return theme.color.blue;
      case 'failed': return theme.color.red;
      case 'pending': return theme.color.orange;
      default: return theme.font.color.tertiary;
    }
  }};
  font-weight: ${({ theme }) => theme.font.weight.medium};
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
        {sortedMessages.map((message) => (
          <StyledMessage
            key={message.id}
            isOutbound={message.direction === 'OUTBOUND'}
          >
            <div>{message.content}</div>
            <StyledMessageMeta 
              isOutbound={message.direction === 'OUTBOUND'}
              status={message.status}
            >
              <span>{new Date(message.timestamp).toLocaleString()}</span>
              <StyledDeliveryStatus status={message.status}>
                {message.status}
              </StyledDeliveryStatus>
            </StyledMessageMeta>
          </StyledMessage>
        ))}
      </StyledMessageList>
    </StyledMessagePreview>
  );
};