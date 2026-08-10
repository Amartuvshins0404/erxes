export const types = `
  enum BlockContractInterestType {
    SIMPLE
    FLAT
    REDUCING
  }

  type BlockContractPaymentPlan {
    downPaymentPercentage: Float
    downPaymentAmount: Float
    barterPercentage: Float
    barterAmount: Float
    interestPercentage: Float
    interestType: BlockContractInterestType
    completionPaymentPercentage: Float
    completionPaymentAmount: Float
    discountPercentage: Float
    description: String
    installment: Int
    frequency: BlockProjectPaymentPlanFrequency
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

  input BlockContractPaymentPlanInput {
    downPaymentPercentage: Float
    downPaymentAmount: Float
    barterPercentage: Float
    barterAmount: Float
    interestPercentage: Float
    interestType: BlockContractInterestType
    completionPaymentPercentage: Float
    completionPaymentAmount: Float
    discountPercentage: Float
    description: String
    installment: Int
    frequency: BlockProjectPaymentPlanFrequency
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

  type BlockContract {
    _id: String
    unit: String!
    number: String
    currency: String
    date: String
    amount: Float
    status: String
    customerId: String
    paymentPlan: BlockContractPaymentPlan
    user: String
  }

  input BlockContractInput {
    unit: String!
    number: String
    currency: String
    date: String
    amount: Float
    status: String
    customerId: String
    paymentPlan: BlockContractPaymentPlanInput
    user: String
  }
`;

export const mutations = `
  blockCreateContract(input: BlockContractInput!): BlockContract
  blockUpdateContract(_id: String!, input: BlockContractInput!): BlockContract
  blockUpdateContractStatus(_id: String!, status: String!): BlockContract
  blockManualSyncContract(contractId: String!): BlockContract
`;

export const queries = `
  blockGetContract(_id: String!): BlockContract
  blockGetContracts(unit: String): [BlockContract]
  blockGetContractsList(
    filter: BlockContractFilterInput
    limit: Int
    cursor: String
    direction: String
  ): BlockContractListResponse
  blockGetUnitContractOverview(unitId: String!): BlockUnitContractOverview
`;

export const contractOverviewType = `
  type BlockOverviewStageCount {
    name: String
    count: Int
  }

  type BlockUnitContractOverview {
    total: Int
    stages: [BlockOverviewStageCount]
  }
`;

export const filterInputTypes = `
  input BlockContractFilterInput {
    projectId: String
    unit: String
    search: String
    status: String
    customerId: String
    currency: String
    dateFrom: String
    dateTo: String
    user: String
  }

  type BlockContractListResponse {
    list: [BlockContract]
    pageInfo: PageInfo
    totalCount: Int
  }
`;
