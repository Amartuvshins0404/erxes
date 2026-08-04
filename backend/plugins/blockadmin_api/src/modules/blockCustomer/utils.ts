import { sendTRPCMessage } from 'erxes-api-shared/utils';
import { IModels } from '~/connectionResolvers';

export const syncCustomerFromCore = async (
  subdomain: string,
  entityId: string,
  models: IModels,
) => {
  const customer = await sendTRPCMessage({
    subdomain,
    pluginName: 'core',
    module: 'customers',
    action: 'findOne',
    input: { _id: entityId },
    defaultValue: null,
  });

  if (!customer) {
    throw new Error('Customer not found');
  }

  return models.BlockCustomer.upsertCustomer(subdomain, entityId, {
    subdomain,
    entityId,
    customerId: entityId,
    firstName: customer.firstName,
    lastName: customer.lastName,
    email: customer.primaryEmail,
    phone: customer.primaryPhone,
  });
};
