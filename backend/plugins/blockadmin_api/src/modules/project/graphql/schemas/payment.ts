export const types = `
  enum BlockAdminProjectPaymentPlanType {
    RESERVATION
    PRE_SALE
    HIRE_PURCHASE
    LOAN_RESERVATION
    INTEREST_FREE_HIRE
    BARTER
    BANK_HOUSING_LOAN
    BANK_MORTGAGE
    SALE
    SALE_BARTER
  }

  enum BlockAdminProjectPaymentPlanFrequency {
    ONE_TIME
    ONE_TIME_PER_MONTH
    TOW_TIME_PER_MONTH
    THREE_TIME_PER_MONTH
    QUARTERLY
    HALF_YEARLY
    YEARLY
  }

  enum BlockAdminProjectPaymentPlanInterestType {
    SIMPLE
    FLAT
    REDUCING
  }

  type BlockAdminProjectPaymentPlan {
    _id: ID!
    name: String
    type: BlockAdminProjectPaymentPlanType!
    downPaymentPercentage: Float
    interestPercentage: Float
    interestType: BlockAdminProjectPaymentPlanInterestType
    completionPaymentPercentage: Float
    discountPercentage: Float
    project: ID!
    description: String
    installment: Int
    frequency: BlockAdminProjectPaymentPlanFrequency
    penaltyPercentage: Float
    vatIncluded: Boolean
  }
`;

export const queries = `
  blockAdminGetProjectPaymentPlans(project: String!): [BlockAdminProjectPaymentPlan]
`;
