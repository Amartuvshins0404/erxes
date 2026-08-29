export const types = `
  type BlockContractPayment {
    _id: String!
    contractId: String!
    contractNumber: String
    customerId: String
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

  type BlockContractPaymentSettings {
    _id: String
    projectId: String
    paymentIds: [String]
    allowPartial: Boolean
    createdAt: Date
    updatedAt: Date
  }

  input BlockContractPaymentSettingsInput {
    paymentIds: [String]
    allowPartial: Boolean
  }

  type BlockContractPaymentInvoice {
    invoiceId: String!
    url: String!
    amount: Float!
    currency: String!
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
    invoiceId: String
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
  blockGetContractPaymentSettings(projectId: String): BlockContractPaymentSettings
`;

export const mutations = `
  blockAddPaymentTransaction(paymentId: String!, amount: Float!, date: Date, note: String, paymentMethod: String): BlockContractPaymentTransaction
  blockUpdatePaymentTransaction(_id: String!, amount: Float, date: Date, note: String, paymentMethod: String): BlockContractPaymentTransaction
  blockRemovePaymentTransaction(_id: String!): BlockContractPaymentTransaction
  blockUpdateContractPaymentSettings(input: BlockContractPaymentSettingsInput!, projectId: String): BlockContractPaymentSettings
  blockCreateContractPaymentInvoice(paymentId: String!, amount: Float): BlockContractPaymentInvoice
`;
