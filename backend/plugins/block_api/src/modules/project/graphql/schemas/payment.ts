export const types = `
  enum BlockProjectPaymentPlanType {
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

  enum BlockProjectPaymentPlanFrequency {
    ONE_TIME
    ONE_TIME_PER_MONTH
    TOW_TIME_PER_MONTH
    THREE_TIME_PER_MONTH
    QUARTERLY
    HALF_YEARLY
    YEARLY
  }

  enum BlockProjectPaymentPlanInterestType {
    SIMPLE
    FLAT
    REDUCING
  }

  type BlockProjectPaymentPlan {
    _id: ID!
    name: String
    type: BlockProjectPaymentPlanType!
    downPaymentPercentage: Float
    interestPercentage: Float
    interestType: BlockProjectPaymentPlanInterestType
    completionPaymentPercentage: Float
    discountPercentage: Float
    project: ID!
    description: String
    installment: Int
    frequency: BlockProjectPaymentPlanFrequency
    penaltyPercentage: Float
    vatIncluded: Boolean
  }

  input BlockProjectPaymentPlanInput {
    name: String
    type: BlockProjectPaymentPlanType!
    downPaymentPercentage: Float
    interestPercentage: Float
    completionPaymentPercentage: Float
    discountPercentage: Float
    project: ID!
    description: String
    installment: Int
    frequency: BlockProjectPaymentPlanFrequency
    penaltyPercentage: Float
    vatIncluded: Boolean
  }
`;

export const queries = `
  blockGetProjectPaymentPlans(project: String!): [BlockProjectPaymentPlan]
`;

export const mutations = `
  blockCreateProjectPaymentPlan(input: BlockProjectPaymentPlanInput!): BlockProjectPaymentPlan
  blockUpdateProjectPaymentPlan(_id: String!, input: BlockProjectPaymentPlanInput!): BlockProjectPaymentPlan
  blockRemoveProjectPaymentPlan(_id: String!): BlockProjectPaymentPlan
`;
