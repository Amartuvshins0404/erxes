import { Resolver } from 'erxes-api-shared/core-types';

import { IProfile } from '@/profile/@types/profile';
import { IContext } from '~/connectionResolvers';
import { sendToAdmin } from '~/utils/adminSync';

export const profileMutations: Record<string, Resolver> = {
  async oroltsooProfileUpdate(
    _root: undefined,
    { input }: { input: IProfile },
    { models, subdomain, checkPermission }: IContext,
  ) {
    await checkPermission('manageOroltsooProfiles');

    const profile = await models.Profile.updateProfileInfo(input);

    if (profile) {
      const {
        _id,
        createdAt,
        updatedAt,
        reviewStatus,
        reviewNote,
        reviewedAt,
        ...synced
      } = profile.toObject();

      sendToAdmin({
        subdomain,
        path: 'syncProfile',
        payload: { entityId: _id, data: { input: synced } },
      });
    }

    return profile;
  },
};
