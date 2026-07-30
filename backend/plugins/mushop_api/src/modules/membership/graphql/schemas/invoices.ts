import { GQL_CURSOR_PARAM_DEFS } from 'erxes-api-shared/utils';

export const types = `
  type MushopCustomerTransaction {
    _id: String
    invoiceId: String
    paymentId: String
    paymentKind: String
    amount: Float
    status: String
    createdAt: Date
    updatedAt: Date
    details: JSON
    response: JSON
  }

  type MushopCustomerInvoice {
    _id: String
    invoiceNumber: String
    amount: Float
    currency: String
    remainingAmount: Float
    status: String
    description: String
    contentType: String
    contentTypeId: String
    createdAt: Date
    resolvedAt: Date
    data: JSON
    transactions: [MushopCustomerTransaction]
  }

  type MushopCustomerInvoicesResponse {
    list: [MushopCustomerInvoice]
    pageInfo: PageInfo
    totalCount: Int
  }
`;

export const queries = `
  mushopMyInvoices(status: String, ${GQL_CURSOR_PARAM_DEFS}): MushopCustomerInvoicesResponse
  mushopMyInvoiceDetail(_id: String!): MushopCustomerInvoice
`;
