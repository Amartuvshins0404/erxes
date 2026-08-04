export const types = `
  enum BlockAdminContractStatus {
    draft
    signed
    completed
    cancelled
  }

  enum BlockAdminContractInterestType {
    SIMPLE
    FLAT
    REDUCING
  }

  type BlockAdminContractPaymentPlan {
    type: BlockAdminProjectPaymentPlanType!
    downPaymentPercentage: Float
    interestPercentage: Float
    interestType: BlockAdminContractInterestType
    completionPaymentPercentage: Float
    discountPercentage: Float
    description: String
    installment: Int
    frequency: BlockAdminProjectPaymentPlanFrequency
    penaltyPercentage: Float
    vatIncluded: Boolean
    paymentDates: [Int]
  }

  enum BlockAdminContractAmountType {
    perSize
    perUnit
  }

  type BlockAdminContract {
    _id: String
    unit: String!
    number: String
    currency: String
    date: String
    amount: Int
    amountType: BlockAdminContractAmountType
    status: BlockAdminContractStatus
    isLifeTime: Boolean
    customerId: String
    paymentPlan: BlockAdminContractPaymentPlan
    user: String
  }
`;

export const queries = `
  blockAdminGetContract(_id: String!): BlockAdminContract
  blockAdminGetContracts(unit: String): [BlockAdminContract]
`;
