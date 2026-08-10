export const types = `
  enum BlockAdminContractStatus {
    reserved
    draft
    signed
    lost
    cancelled
  }

  enum BlockAdminContractInterestType {
    SIMPLE
    FLAT
    REDUCING
  }

  type BlockAdminContractPaymentPlan {
    downPaymentPercentage: Float
    downPaymentAmount: Float
    barterPercentage: Float
    barterAmount: Float
    interestPercentage: Float
    interestType: BlockAdminContractInterestType
    completionPaymentPercentage: Float
    completionPaymentAmount: Float
    discountPercentage: Float
    description: String
    installment: Int
    frequency: BlockAdminProjectPaymentPlanFrequency
    penaltyPercentage: Float
    vatIncluded: Boolean
    roundedInstallmentAmount: Float
    installmentAmounts: [Float]
    paymentDates: [Int]
    paymentDueDates: [Date]
    firstPaymentDate: Date
    downPaymentDate: Date
    completionPaymentDate: Date
    completionPaymentDateLabel: String
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
