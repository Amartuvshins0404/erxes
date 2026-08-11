export const types = `
  enum CpBlockOfferStatus {
    draft
    sent
  }

  type CpBlockOfferPaymentPlan {
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

  type CpBlockOfferScheduleRow {
    label: String
    date: Date
    type: String
    amount: Float
  }

  type CpBlockOfferPaymentSchedule {
    rows: [CpBlockOfferScheduleRow]
    total: Float
  }

  type CpBlockOffer {
    _id: String
    unit: String
    unitDetail: CpBlockAdminUnit
    project: BlockAdminProject
    unitType: CpBlockAdminUnitType
    number: String
    currency: String
    date: Date
    amount: Float
    status: CpBlockOfferStatus
    endDate: Date
    paymentPlan: CpBlockOfferPaymentPlan
    paymentSchedule: CpBlockOfferPaymentSchedule
  }
`;

export const queries = `
  cpBlockAdminGetOffers: [CpBlockOffer]
  cpBlockAdminGetOffer(offerId: String!): CpBlockOffer
`;
