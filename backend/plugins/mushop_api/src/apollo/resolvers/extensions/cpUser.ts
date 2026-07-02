import { sendTRPCMessage } from 'erxes-api-shared/utils';
import { IContext } from '~/connectionResolvers';

type ICPUser = {
  _id: string;
  erxesCustomerId?: string;
};

const getCustomerId = async (cpUserId: string, subdomain: string) => {
  const cpUser = await sendTRPCMessage({
    subdomain,
    pluginName: 'core',
    method: 'query',
    module: 'cpUsers',
    action: 'get',
    input: {
      id: cpUserId,
    },
  });

  return cpUser?.erxesCustomerId || cpUserId;
};

export const CPUser = {
  isMembership: async (
    cpUser: ICPUser,
    _args: undefined,
    context: IContext,
  ) => {
    const { models } = context;

    const customerId = await getCustomerId(cpUser._id, context.subdomain);

    const membership = await models.Membership.getActiveMembership(
      customerId,
    );

    return !!membership;
  },
  membership: async (
    cpUser: ICPUser,
    _args: undefined,
    context: IContext,
  ) => {
    const { models } = context;

    const customerId = await getCustomerId(cpUser._id, context.subdomain);

    return models.Membership.getActiveMembership(customerId);
  },
};
