export const types = `
  enum CpBlockPaymentStatus {
    unpaid
    partial
    paid
    cancelled
  }

  type CpBlockPayment {
    _id: String
    contractId: String
    contractNumber: String
    index: Int
    label: String
    dueDate: Date
    amount: Float
    currency: String
    status: CpBlockPaymentStatus
    paidAmount: Float
    paidDate: Date
  }

  type CpBlockContract {
    _id: String
    unit: String
    number: String
    currency: String
    date: Date
    amount: Int
    amountType: BlockAdminContractAmountType
    status: BlockAdminContractStatus
    isLifeTime: Boolean
    signedAt: Date
    paymentPlan: BlockAdminContractPaymentPlan
  }

  type CpBlockContractSummary {
    totalAmount: Float
    totalPaidAmount: Float
    totalUnpaidAmount: Float
    nextPayment: CpBlockPayment
  }
`;

export const queries = `
  cpBlockAdminGetContracts: [CpBlockContract]
  cpBlockAdminGetContractPayments(contractId: String!): [CpBlockPayment]
  cpBlockAdminGetContractSummary(contractId: String!): CpBlockContractSummary
  cpBlockAdminGetPayments: [CpBlockPayment]
  cpBlockAdminGetSummary: CpBlockContractSummary
`;
