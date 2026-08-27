import { Resolver } from 'erxes-api-shared/core-types';

import { IContext } from '~/connectionResolvers';

export const profileQueries: Record<string, Resolver> = {
  async oroltsooProfileInfo(
    _root: undefined,
    _params: undefined,
    { models, checkPermission }: IContext,
  ) {
    await checkPermission('showOroltsooProfiles');

    return models.Profile.getProfileInfo();
  },
};
