export const types = `
  type CpBlockPaymentInvoice {
    invoiceId: String!
    url: String!
    amount: Float!
    currency: String!
  }

  type CpBlockPaymentCheck {
    status: String!
    paymentStatus: String
    paidAmount: Float
    amount: Float
  }
`;

export const mutations = `
  cpBlockAdminCreatePaymentInvoice(paymentId: String!, amount: Float): CpBlockPaymentInvoice
  cpBlockAdminCheckPaymentInvoice(contractId: String!, invoiceId: String!): CpBlockPaymentCheck
`;
