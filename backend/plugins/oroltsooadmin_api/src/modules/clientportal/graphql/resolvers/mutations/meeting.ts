import { Resolver } from 'erxes-api-shared/core-types';
import { markResolvers } from 'erxes-api-shared/utils';

import {
  ICpMeetingUser,
  IMeetingRequestInput,
} from '@/meeting/@types/meeting';
import { IContext } from '~/connectionResolvers';

export const cpMeetingMutations: Record<string, Resolver> = {
  async cpOroltsooMeetingRequestAdd(
    _root: undefined,
    { input }: { input: IMeetingRequestInput },
    { models, cpUser }: IContext,
  ) {
    const requester: ICpMeetingUser = cpUser || {};

    return models.Meeting.createMeetingRequest(requester, input);
  },
};

markResolvers(cpMeetingMutations, {
  wrapperConfig: {
    forClientPortal: true,
    cpUserRequired: true,
  },
});
