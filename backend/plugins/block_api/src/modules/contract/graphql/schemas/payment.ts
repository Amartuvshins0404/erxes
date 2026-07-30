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
    status: String
    paidAmount: Float
    paidDate: Date
    note: String
    penaltyAmount: Float
    overdueDays: Int
    createdAt: Date
    updatedAt: Date
  }

  type BlockContractPaymentListResponse {
    list: [BlockContractPayment]
    pageInfo: PageInfo
    totalCount: Int
  }

  type BlockContractPaymentTransaction {
    _id: String!
    paymentId: String!
    contractId: String!
    amount: Float!
    date: Date!
    note: String
    createdBy: String
    paymentMethod: String
    createdAt: Date
    updatedAt: Date
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
    contractNumber: String,
    customerId: String,
    unitNumber: String,
    limit: Int,
    cursor: String,
    direction: String,
  ): BlockContractPaymentListResponse
  blockGetPaymentTransactions(paymentId: String!): [BlockContractPaymentTransaction]
  blockGetUnitPaymentPlanData(unitId: String!): [BlockContractPayment]
  blockGetProjectPaymentPlanData(projectId: String!): [BlockContractPayment]
  blockGetUnitPaymentTransactions(unitId: String!): [BlockContractPaymentTransaction]
  blockGetProjectPaymentTransactions(projectId: String!): [BlockContractPaymentTransaction]
`;

export const mutations = `
  blockAddPaymentTransaction(paymentId: String!, amount: Float!, date: Date, note: String, paymentMethod: String): BlockContractPaymentTransaction
  blockUpdatePaymentTransaction(_id: String!, amount: Float, date: Date, note: String, paymentMethod: String): BlockContractPaymentTransaction
  blockRemovePaymentTransaction(_id: String!): BlockContractPaymentTransaction
`;
