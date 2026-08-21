import { markResolvers } from 'erxes-api-shared/utils';
import { IContext } from '~/connectionResolvers';

const getBlockCustomer = async (
  models: IContext['models'],
  customerId: string | undefined,
) => {
  if (!customerId) {
    return null;
  }

  return models.BlockCustomer.findOne({ customerId }).lean();
};

export const cpOfferQueries = {
  cpBlockAdminGetOffers: async (
    _parent: undefined,
    _args: undefined,
    { models, cpUser }: IContext,
  ) => {
    const blockCustomer = await getBlockCustomer(
      models,
      cpUser?.erxesCustomerId,
    );

    if (!blockCustomer) {
      return [];
    }

    return models.Offer.find({
      customerId: blockCustomer.entityId,
    }).lean();
  },

  cpBlockAdminGetOffer: async (
    _parent: undefined,
    { offerId }: { offerId: string },
    { models }: IContext,
  ) => {
    return models.Offer.findOne({ _id: offerId }).lean();
  },
};

markResolvers(cpOfferQueries, {
  wrapperConfig: {
    forClientPortal: true,
    cpUserRequired: true,
  },
});
