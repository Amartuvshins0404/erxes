export const types = `
  enum BlockAdminOfferPartyType {
    customer
    company
  }

  enum BlockAdminOfferInterestType {
    SIMPLE
    FLAT
    REDUCING
  }

  type BlockAdminOfferPaymentPlan {
    type: BlockAdminProjectPaymentPlanType!
    downPaymentPercentage: Float
    downPaymentAmount: Float
    barterPercentage: Float
    barterAmount: Float
    interestPercentage: Float
    interestType: BlockAdminOfferInterestType
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

  enum BlockAdminOfferAmountType {
    priceBySize
    priceBySize
  }

  type BlockAdminOffer {
    _id: String
    unit: String!
    number: String
    currency: String
    date: String
    amount: Float
    amountType: BlockAdminOfferAmountType
    endDate: String
    party: BlockAdminOfferParty
    paymentPlan: BlockAdminOfferPaymentPlan
    user: String
  }

  type BlockAdminOfferParty {
    type: BlockAdminOfferPartyType
    id: String
  }

  enum BlockAdminOfferStatus {
    draft
    sent
  }

  input BlockAdminOfferInvoicesInput {
    _id: String
    amount: Float
    date: Date
    customDate: String
    description: String
    status: String
    number: Int
    paidDate: Date
  }
`;

export const queries = `
  blockAdminGetOffer(_id: String!): BlockAdminOffer
  blockAdminGetOffers(unit: String): [BlockAdminOffer]
`;
