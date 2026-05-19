export const types = `
  type BlockContractPayment {
    _id: String!
    contractId: String!
    contractNumber: String
    partyId: String
    partyType: String
    projectId: String
    unit: String
    index: Int!
    label: String
    dueDate: Date
    amount: Float
    currency: String
    paid: Boolean
    paidAmount: Float
    paidDate: Date
    note: String
    createdAt: Date
    updatedAt: Date
  }

  type BlockContractPaymentListResponse {
    list: [BlockContractPayment]
    pageInfo: PageInfo
    totalCount: Int
  }
`;

export const queries = `
  blockGetContractPayments(
    contractId: String!,
    limit: Int,
    cursor: String,
    direction: String,
  ): BlockContractPaymentListResponse
  blockGetProjectPayments(
    projectId: String!,
    paid: Boolean,
    limit: Int,
    cursor: String,
    direction: String,
  ): BlockContractPaymentListResponse
`;

export const mutations = `
  blockMarkContractPaymentPaid(_id: String!, paidAmount: Float, paidDate: Date, note: String): BlockContractPayment
  blockMarkContractPaymentUnpaid(_id: String!): BlockContractPayment
`;
