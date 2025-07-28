import { useOnDbEvent } from '@/subscription/hooks/useOnDbEvent';
import { DatabaseEventAction } from '~/generated/graphql';

type TribMessageSubscriptionProps = {
  personId?: string;
  onMessageCreated?: (message: any) => void;
  onMessageUpdated?: (message: any) => void;
  skip?: boolean;
};

export const useTribMessageSubscription = ({
  personId,
  onMessageCreated,
  onMessageUpdated,
  skip = false,
}: TribMessageSubscriptionProps) => {
  // Subscribe to new messages (incoming messages)
  useOnDbEvent({
    input: { 
      action: DatabaseEventAction.CREATED,
      objectNameSingular: 'tribMessage',
    },
    onData: (data) => {
      const newMessage = data.onDbEvent.record;
      
      // Filter by personId if provided (for person-specific conversations)
      if (personId && newMessage.contactPersonId !== personId) {
        return;
      }
      
      onMessageCreated?.(newMessage);
    },
    skip,
  });

  // Subscribe to message status updates (delivery status changes)
  useOnDbEvent({
    input: { 
      action: DatabaseEventAction.UPDATED,
      objectNameSingular: 'tribMessage',
    },
    onData: (data) => {
      const updatedMessage = data.onDbEvent.record;
      const updatedFields = data.onDbEvent.updatedFields || [];
      
      // Filter by personId if provided
      if (personId && updatedMessage.contactPersonId !== personId) {
        return;
      }
      
      // Only trigger callback if status-related fields were updated
      if (updatedFields.includes('status') || updatedFields.includes('externalId')) {
        onMessageUpdated?.(updatedMessage);
      }
    },
    skip,
  });
};