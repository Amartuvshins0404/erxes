import { IModels } from '~/connectionResolvers';

export interface ICustomerSyncData {
  email?: string;
  phone?: string;
}

export const resolveBlockCustomer = async (
  subdomain: string,
  entityId: string,
  data: ICustomerSyncData,
  models: IModels,
) => {
  const byEntity = await models.BlockCustomer.findOne({
    subdomain,
    entityId,
  }).lean();

  if (byEntity) {
    return byEntity;
  }

  const { email, phone } = data || {};

  const byIdentity =
    (email || phone) &&
    (await models.BlockCustomer.findOne({
      $or: [...(email ? [{ email }] : []), ...(phone ? [{ phone }] : [])],
    }).lean());

  if (byIdentity) {
    return byIdentity;
  }

  throw new Error('Customer not registered in block');
};
