import { IContext } from '~/connectionResolvers';
import { Resolver } from 'erxes-api-shared/core-types';
import { sendTRPCMessage } from 'erxes-api-shared/utils';

const mushopMyInvoices: Resolver = async (_root, params, context) => {
  const { subdomain, cpUser } = context as IContext;
  if (!cpUser) return { list: [], pageInfo: null, totalCount: 0 };

  const customerId = cpUser.erxesCustomerId || cpUser._id;

  const query: Record<string, any> = {
    customerId,
    contentType: 'mushop:membership',
  };

  if (params.status) query.status = params.status;

  const list = await sendTRPCMessage({
    subdomain,
    pluginName: 'payment',
    method: 'query',
    module: 'invoices',
    action: 'find',
    input: query,
  });

  return {
    list: list || [],
    pageInfo: null,
    totalCount: (list || []).length,
  };
};

mushopMyInvoices.wrapperConfig = {
  forClientPortal: true,
  cpUserRequired: true,
};

const mushopMyInvoiceDetail: Resolver = async (_root, { _id }, context) => {
  const { subdomain, cpUser } = context as IContext;
  if (!cpUser) return null;

  return sendTRPCMessage({
    subdomain,
    pluginName: 'payment',
    method: 'query',
    module: 'payment',
    action: 'getInvoiceWithTransactions',
    input: { _id },
  });
};

mushopMyInvoiceDetail.wrapperConfig = {
  forClientPortal: true,
  cpUserRequired: true,
};

export const mushopInvoiceQueries = {
  mushopMyInvoices,
  mushopMyInvoiceDetail,
};
