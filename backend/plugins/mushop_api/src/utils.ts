import { sendTRPCMessage } from 'erxes-api-shared/utils';
import { Schema } from 'mongoose';
import { IContext } from './connectionResolvers';

export const schemaWrapper = (schema: Schema) => {
  schema.add({
    subdomain: { type: String, required: true, index: true },
    entityId: { type: String, required: true, index: true },
  });

  schema.index({ subdomain: 1, entityId: 1 }, { unique: true });

  return schema;
};

export const checkMembership = async ({
  models,
  subdomain,
  cpUserId,
}: {
  models: IContext['models'];
  subdomain: string;
  cpUserId: string;
}): Promise<boolean> => {
  if (!cpUserId) return false;

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

  const membership = models.Membership.getActiveMembership(
    cpUser?.erxesCustomerId || cpUserId,
  );

  return !!membership;
};
