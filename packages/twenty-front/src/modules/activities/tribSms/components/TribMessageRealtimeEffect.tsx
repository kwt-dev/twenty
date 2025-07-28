import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';
import { useTribMessageSubscription } from '@/activities/tribSms/hooks/useTribMessageSubscription';
import { getTribSmsMessagesFromPersonId } from '@/activities/tribSms/graphql/queries/getTribSmsMessagesFromPersonId';
import { useRecoilValue } from 'recoil';
import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';

type TribMessageRealtimeEffectProps = {
  personId: string;
};

export const TribMessageRealtimeEffect = ({ personId }: TribMessageRealtimeEffectProps) => {
  const apolloCoreClient = useApolloCoreClient();
  const currentWorkspace = useRecoilValue(currentWorkspaceState);

  useTribMessageSubscription({
    personId,
    onMessageCreated: (newMessage) => {
      // Refetch the messages query to include the new message
      apolloCoreClient.refetchQueries({
        include: [getTribSmsMessagesFromPersonId],
      });
    },
    onMessageUpdated: (updatedMessage) => {
      // Update the specific message in the cache
      const queryOptions = {
        query: getTribSmsMessagesFromPersonId,
        variables: { personId },
      };

      try {
        const existingData = apolloCoreClient.readQuery(queryOptions);
        
        if (existingData?.getTribSmsMessagesFromPersonId?.tribSmsMessages) {
          const updatedData = {
            ...existingData,
            getTribSmsMessagesFromPersonId: {
              ...existingData.getTribSmsMessagesFromPersonId,
              tribSmsMessages: existingData.getTribSmsMessagesFromPersonId.tribSmsMessages.map((participant: any) => {
                if (participant.tribMessage.id === updatedMessage.id) {
                  return {
                    ...participant,
                    tribMessage: {
                      ...participant.tribMessage,
                      ...updatedMessage,
                    },
                  };
                }
                return participant;
              }),
            },
          };

          apolloCoreClient.writeQuery({
            ...queryOptions,
            data: updatedData,
          });
        }
      } catch (error) {
        // If cache read fails, just refetch the entire query
        apolloCoreClient.refetchQueries({
          include: [getTribSmsMessagesFromPersonId],
        });
      }
    },
    skip: !personId || !currentWorkspace,
  });

  return null;
};