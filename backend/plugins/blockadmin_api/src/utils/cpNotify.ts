import { sendTRPCMessage } from 'erxes-api-shared/utils';
import { IModels } from '~/connectionResolvers';

interface ICpUser {
  _id: string;
  clientPortalId?: string;
}

const findCpUsers = async (
  subdomain: string,
  customerId: string,
): Promise<ICpUser[]> => {
  const result = await sendTRPCMessage({
    subdomain,
    pluginName: 'core',
    method: 'query',
    module: 'cpUsers',
    action: 'list',
    input: { erxesCustomerId: customerId, limit: 1000, skip: 0 },
    defaultValue: { list: [] as ICpUser[], totalCount: 0 },
  });

  return result?.list || [];
};

export interface ICpNotificationData {
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  contentType?: string;
  contentTypeId?: string;
}

// orgCustomerId is block_api's org-side customer reference (mirrors
// BlockCustomer.entityId), not the verified core customerId — resolve it
// through BlockCustomer before it can be used to look up client-portal users.
// One customer can have cp users on more than one client portal, so this
// sends one cpNotifications.create call per portal.
export const notifyBlockCustomer = async (
  models: IModels,
  subdomain: string,
  orgCustomerId: string,
  data: ICpNotificationData,
) => {
  const blockCustomer = await models.BlockCustomer.findOne({
    subdomain,
    entityId: orgCustomerId,
  }).lean();

  if (!blockCustomer) {
    return;
  }

  const cpUsers = await findCpUsers(subdomain, blockCustomer.customerId);

  const cpUserIdsByPortal = new Map<string, string[]>();

  for (const cpUser of cpUsers) {
    if (!cpUser.clientPortalId) {
      continue;
    }

    const ids = cpUserIdsByPortal.get(cpUser.clientPortalId) || [];
    ids.push(cpUser._id);
    cpUserIdsByPortal.set(cpUser.clientPortalId, ids);
  }

  for (const [clientPortalId, cpUserIds] of cpUserIdsByPortal) {
    await sendTRPCMessage({
      subdomain,
      pluginName: 'core',
      method: 'mutation',
      module: 'cpNotifications',
      action: 'create',
      input: {
        cpUserIds,
        clientPortalId,
        data,
      },
      defaultValue: null,
    });
  }
};
