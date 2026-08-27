import { Resolver } from 'erxes-api-shared/core-types';

import { IProfileDocument } from '@/profile/@types/profile';
import { IContext } from '~/connectionResolvers';
import { REVIEW_STATUSES } from '~/constants';
import { sendToTenant } from '~/utils/tenantSync';

const notifyTenant = (profile: IProfileDocument | null) => {
  if (!profile) {
    return;
  }

  sendToTenant({
    subdomain: profile.subdomain,
    path: 'syncReviewStatus',
    payload: {
      entityId: profile.entityId,
      data: {
        input: {
          reviewStatus: profile.reviewStatus,
          reviewNote: profile.reviewNote ?? '',
          reviewedAt: new Date(),
        },
      },
    },
  });
};

export const profileMutations: Record<string, Resolver> = {
  async oroltsooAdminProfileVerify(
    _root: undefined,
    { _id, note }: { _id: string; note?: string },
    { models }: IContext,
  ) {
    const profile = await models.Profile.setReviewStatus(
      _id,
      REVIEW_STATUSES.VERIFIED,
      note,
    );

    notifyTenant(profile);

    return profile;
  },

  async oroltsooAdminProfileReject(
    _root: undefined,
    { _id, note }: { _id: string; note?: string },
    { models }: IContext,
  ) {
    const profile = await models.Profile.setReviewStatus(
      _id,
      REVIEW_STATUSES.REJECTED,
      note,
    );

    notifyTenant(profile);

    return profile;
  },
};
