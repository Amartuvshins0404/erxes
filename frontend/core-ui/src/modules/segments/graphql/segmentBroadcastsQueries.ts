import { gql } from '@apollo/client';
import { GQL_CURSOR_PARAM_DEFS, GQL_CURSOR_PARAMS, GQL_PAGE_INFO } from 'erxes-ui';

export const SEGMENT_BROADCASTS = gql`
  query SegmentBroadcasts($segmentId: String, ${GQL_CURSOR_PARAM_DEFS}) {
    engageMessages(segmentId: $segmentId, ${GQL_CURSOR_PARAMS}) {
      list {
        _id
        title
        isLive
        isDraft
        scheduleDate {
          type
        }
      }
      ${GQL_PAGE_INFO}
    }
  }
`;
