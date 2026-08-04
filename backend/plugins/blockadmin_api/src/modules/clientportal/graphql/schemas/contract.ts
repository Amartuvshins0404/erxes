export const types = `
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
`;

export const queries = `
  cpBlockAdminGetContracts: [CpBlockContract]
`;
