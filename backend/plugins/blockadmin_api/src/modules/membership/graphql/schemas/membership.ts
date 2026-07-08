import { GQL_CURSOR_PARAM_DEFS } from 'erxes-api-shared/utils';

export const types = `
  type BaMembership {
    _id: String!
    customerId: String!
    planId: String
    plan: BaMembershipPlan
    status: String
    startDate: Date
    endDate: Date
    amount: Float
    currency: String
    invoiceId: String
    customer: JSON
    createdAt: Date
    updatedAt: Date
  }

  type BaMembershipListResponse {
    list: [BaMembership]
    pageInfo: PageInfo
    totalCount: Int
  }
`;

export const queries = `
  baMemberships(searchValue: String, status: String, ${GQL_CURSOR_PARAM_DEFS}): BaMembershipListResponse
  baMembershipDetail(_id: String!): BaMembership
`;

export const mutations = `
  baCancelMembership(_id: String!): BaMembership
  baGrantMembership(customerId: String!, planId: String!, paymentId: String, amount: Float): BaMembership
  baUpdateMembershipEndDate(_id: String!, endDate: Date!): BaMembership
  baUpdateMembershipStatus(_id: String!, status: String!): BaMembership
`;
