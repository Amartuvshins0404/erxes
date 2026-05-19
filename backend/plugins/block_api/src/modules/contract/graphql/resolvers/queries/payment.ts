import { cursorPaginate } from 'erxes-api-shared/utils';
import { IContractPaymentDocument } from '@/contract/@types/payment';
import { IContext } from '~/connectionResolvers';

export const contractPaymentQueries = {
  blockGetContractPayments: async (
    _parent: undefined,
    {
      contractId,
      limit,
      cursor,
      direction,
    }: {
      contractId: string;
      limit?: number;
      cursor?: string;
      direction?: 'forward' | 'backward';
    },
    { models }: IContext,
  ) => {
    return cursorPaginate<IContractPaymentDocument>({
      model: models.ContractPayment as any,
      params: {
        limit: limit ?? 30,
        cursor,
        direction: direction ?? 'forward',
        orderBy: { index: 'asc' },
      },
      query: { contractId },
    });
  },

  blockGetProjectPayments: async (
    _parent: undefined,
    {
      projectId,
      paid,
      limit,
      cursor,
      direction,
    }: {
      projectId: string;
      paid?: boolean;
      limit?: number;
      cursor?: string;
      direction?: 'forward' | 'backward';
    },
    { models }: IContext,
  ) => {
    const filter: Record<string, any> = { projectId };
    if (typeof paid === 'boolean') filter.paid = paid;

    return cursorPaginate<IContractPaymentDocument>({
      model: models.ContractPayment as any,
      params: {
        limit: limit ?? 30,
        cursor,
        direction: direction ?? 'forward',
        orderBy: { dueDate: 'asc' },
      },
      query: filter,
    });
  },
};
