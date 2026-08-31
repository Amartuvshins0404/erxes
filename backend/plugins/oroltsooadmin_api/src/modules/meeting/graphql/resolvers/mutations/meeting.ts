import { Resolver } from 'erxes-api-shared/core-types';

import {
  IMeetingDocument,
  IMeetingInput,
} from '@/meeting/@types/meeting';
import { IContext } from '~/connectionResolvers';
import { sendToTenant } from '~/utils/tenantSync';

const syncMeeting = (meeting: IMeetingDocument | null) => {
  if (!meeting) {
    return;
  }

  const { title, location, scheduledAt, note, status } = meeting;

  sendToTenant({
    subdomain: meeting.subdomain,
    path: 'syncMeeting',
    payload: {
      entityId: meeting._id,
      data: { input: { title, location, scheduledAt, note, status } },
    },
  });
};

export const meetingMutations: Record<string, Resolver> = {
  async oroltsooAdminMeetingAdd(
    _root: undefined,
    { subdomain, input }: { subdomain: string; input: IMeetingInput },
    { models }: IContext,
  ) {
    const meeting = await models.Meeting.createMeeting(subdomain, input);

    syncMeeting(meeting);

    return meeting;
  },

  async oroltsooAdminMeetingEdit(
    _root: undefined,
    { _id, input }: { _id: string; input: IMeetingInput },
    { models }: IContext,
  ) {
    const meeting = await models.Meeting.updateMeeting(_id, input);

    syncMeeting(meeting);

    return meeting;
  },

  async oroltsooAdminMeetingRemove(
    _root: undefined,
    { _ids }: { _ids: string[] },
    { models }: IContext,
  ) {
    const { deletedCount, meetings } = await models.Meeting.removeMeetings(
      _ids,
    );

    for (const meeting of meetings) {
      sendToTenant({
        subdomain: meeting.subdomain,
        path: 'removeMeeting',
        payload: { entityId: meeting._id },
      });
    }

    return { deletedCount };
  },
};
