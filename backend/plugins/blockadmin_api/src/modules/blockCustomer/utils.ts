import { sendTRPCMessage } from 'erxes-api-shared/utils';
import { IModels } from '~/connectionResolvers';

export interface ICustomerSyncData {
  email?: string;
  phone?: string;
}

const findCoreCustomer = async (
  subdomain: string,
  email?: string,
  phone?: string,
) => {
  if (email) {
    const customer = await sendTRPCMessage({
      subdomain,
      pluginName: 'core',
      module: 'customers',
      action: 'findOne',
      input: { customerPrimaryEmail: email },
      defaultValue: null,
    });

    if (customer?._id) {
      return customer;
    }
  }

  if (phone) {
    const customer = await sendTRPCMessage({
      subdomain,
      pluginName: 'core',
      module: 'customers',
      action: 'findOne',
      input: { customerPrimaryPhone: phone },
      defaultValue: null,
    });

    if (customer?._id) {
      return customer;
    }
  }

  return null;
};

export const resolveBlockCustomer = async (
  subdomain: string,
  entityId: string,
  data: ICustomerSyncData,
  models: IModels,
) => {
  const { email, phone } = data || {};

  const customer = await findCoreCustomer(subdomain, email, phone);

  if (!customer) {
    throw new Error('Customer not registered in block');
  }

  return models.BlockCustomer.findOneAndUpdate(
    { subdomain, entityId },
    {
      $set: {
        subdomain,
        entityId,
        customerId: customer._id,
      },
    },
    { upsert: true, new: true },
  ).lean();
};
