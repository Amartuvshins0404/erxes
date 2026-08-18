import { useMutation } from '@apollo/client';
import { useToast } from 'erxes-ui';
import {
  EVENTS_ADD,
  EVENTS_EDIT,
  EVENTS_REMOVE,
} from '@/events/graphql/mutations';
import { EventStatus, IEventAgendaItem, IEventLocation } from '~/types/event';

export interface IEventMutationDoc {
  name: string;
  description?: string;
  coverImage?: string;
  images?: string[];
  videoUrl?: string;
  startDate?: string;
  endDate?: string;
  location?: IEventLocation;
  isOnline?: boolean;
  onlineUrl?: string;
  capacity?: number;
  status?: EventStatus;
  agenda?: IEventAgendaItem[];
}

const REFETCH = ['Events'];

export const useEventMutations = () => {
  const { toast } = useToast();

  const [addEvent, { loading: adding }] = useMutation(EVENTS_ADD, {
    refetchQueries: REFETCH,
  });
  const [editEvent, { loading: editing }] = useMutation(EVENTS_EDIT, {
    refetchQueries: REFETCH,
  });
  const [removeEvents, { loading: removing }] = useMutation(EVENTS_REMOVE, {
    refetchQueries: REFETCH,
  });

  const notifyError = (error: { message: string }) =>
    toast({
      title: 'Something went wrong',
      description: error.message,
      variant: 'destructive',
    });

  const createEvent = (doc: IEventMutationDoc) =>
    addEvent({
      variables: { doc },
      onCompleted: () =>
        toast({ title: 'Event created', description: doc.name }),
      onError: notifyError,
    });

  const updateEvent = (_id: string, doc: IEventMutationDoc) =>
    editEvent({
      variables: { _id, doc },
      onCompleted: () =>
        toast({ title: 'Event updated', description: doc.name }),
      onError: notifyError,
    });

  const deleteEvents = (_ids: string[]) =>
    removeEvents({
      variables: { _ids },
      onCompleted: () =>
        toast({
          title: _ids.length > 1 ? 'Events removed' : 'Event removed',
          description: `${_ids.length} removed`,
        }),
      onError: notifyError,
    });

  return {
    createEvent,
    updateEvent,
    deleteEvents,
    loading: adding || editing || removing,
  };
};
