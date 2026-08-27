import {
  IProfileDocument,
  IProfileFinance,
} from '@/profile/@types/profile';
import { IContext } from '~/connectionResolvers';

export const OroltsooProfile = {
  async __resolveReference(
    { _id }: { _id: string },
    _args: undefined,
    { models }: IContext,
  ) {
    return models.Profile.findOne({ _id }).lean();
  },

  fullName({ firstName, lastName }: IProfileDocument) {
    return [lastName, firstName].filter(Boolean).join(' ');
  },

  promiseProgress({ promises }: IProfileDocument) {
    if (!promises?.length) {
      return 0;
    }

    const total = promises.reduce(
      (sum, promise) => sum + (promise.progress || 0),
      0,
    );

    return Math.round(total / promises.length);
  },
};

export const OroltsooProfileFinance = {
  totalDonations({ donations }: IProfileFinance) {
    return (donations || []).reduce(
      (sum, donation) => sum + (donation.amount || 0),
      0,
    );
  },
};
