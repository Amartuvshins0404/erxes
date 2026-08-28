export const types = `
  type CpBlockPaymentInvoice {
    invoiceId: String!
    url: String!
    amount: Float!
    currency: String!
  }
`;

export const mutations = `
  cpBlockAdminCreatePaymentInvoice(paymentId: String!, amount: Float): CpBlockPaymentInvoice
`;
