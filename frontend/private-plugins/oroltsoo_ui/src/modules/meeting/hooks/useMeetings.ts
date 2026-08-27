import { QueryHookOptions } from '@apollo/client';

import { useCursorList } from '@/shared/hooks/useCursorList';
import {
  MEETINGS_CURSOR_SESSION_KEY,
  MEETINGS_PER_PAGE,
} from '../constants/meetingConstants';
import { OROLTSOO_MEETINGS } from '../graphql/queries/meetingQueries';
import { IMeeting } from '../types/meeting';

export const useMeetings = (options?: QueryHookOptions) => {
  const { list, ...rest } = useCursorList<IMeeting>({
    document: OROLTSOO_MEETINGS,
    responseKey: 'oroltsooMeetings',
    sessionKey: MEETINGS_CURSOR_SESSION_KEY,
    perPage: MEETINGS_PER_PAGE,
    options,
  });

  return { meetings: list, ...rest };
};
