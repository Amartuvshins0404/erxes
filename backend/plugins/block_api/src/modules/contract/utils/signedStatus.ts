import { IContractDocument } from '@/contract/@types/contract';
import { IModels } from '~/connectionResolvers';
import { sendMessage } from '@/admin/utils';

export const handleContractSigned = async (
  contract: IContractDocument,
  models: IModels,
  subdomain: string,
) => {
  sendMessage({
    subdomain,
    path: 'contractSigned',
    payload: {
      data: {
        customerId: contract.customerId,
      },
      entityId: contract._id,
    },
  });
};
