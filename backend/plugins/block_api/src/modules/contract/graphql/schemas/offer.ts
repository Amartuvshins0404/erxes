export const types = `
  enum BlockOfferPartyType {
    customer
    company
  }

  enum BlockOfferInterestType {
    SIMPLE
    FLAT
    REDUCING
  }

  type BlockOfferPaymentPlan {
    downPaymentPercentage: Float
    downPaymentAmount: Float
    barterPercentage: Float
    barterAmount: Float
    interestPercentage: Float
    interestType: BlockOfferInterestType
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

  input BlockOfferPaymentPlanInput {
    downPaymentPercentage: Float
    downPaymentAmount: Float
    barterPercentage: Float
    barterAmount: Float
    interestPercentage: Float
    interestType: BlockOfferInterestType
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

  type BlockOffer {
    _id: String
    unit: String!
    project: String
    number: String
    currency: String
    date: String
    amount: Float
    status: BlockOfferStatus
    endDate: String
    party: BlockOfferParty
    paymentPlan: BlockOfferPaymentPlan
    user: String
  }

  type BlockOfferParty {
    type: BlockOfferPartyType
    id: String
  }

  input BlockOfferPartyInput {
    type: BlockOfferPartyType
    id: String
  }

  enum BlockOfferStatus {
    draft
    sent
  }

  input BlockOfferInvoicesInput {
    _id: String
    amount: Float
    date: Date
    customDate: String
    description: String
    status: String
    number: Int
    paidDate: Date
  }


  input BlockOfferInput {
    unit: String!
    project: String
    number: String
    currency: String
    date: String
    amount: Float
    status: BlockOfferStatus
    endDate: String
    party: BlockOfferPartyInput
    paymentPlan: BlockOfferPaymentPlanInput
    user: String
    description: String

    invoices: [BlockOfferInvoicesInput]
  }
`;

export const mutations = `
  blockCreateOffer(input: BlockOfferInput!): BlockOffer
  blockUpdateOffer(_id: String!, input: BlockOfferInput!): BlockOffer
  blockSendOfferEmail(_id: String!): String
`;

export const queries = `
  blockGetOffer(_id: String!): BlockOffer
  blockGetOffers(unit: String, project: String): [BlockOffer]
  blockGetOffersList(
    filter: BlockOfferFilterInput
    limit: Int
    cursor: String
    direction: String
  ): BlockOfferListResponse
  blockGetUnitOfferStats(unitId: String!): BlockUnitOfferStats
`;

export const offerStatsType = `
  type BlockUnitOfferStats {
    totalCount: Int
    sentCount: Int
    draftCount: Int
    averageAmount: Float
    highestAmount: Float
    lowestAmount: Float
    currency: String
  }
`;

export const filterInputTypes = `
  input BlockOfferFilterInput {
    projectId: String
    unit: String
    search: String
    status: String
    partyType: String
    currency: String
    dateFrom: String
    dateTo: String
    user: String
  }

  type BlockOfferListResponse {
    list: [BlockOffer]
    pageInfo: PageInfo
    totalCount: Int
  }
`;
