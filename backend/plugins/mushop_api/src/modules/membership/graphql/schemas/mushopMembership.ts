import { GQL_CURSOR_PARAM_DEFS } from 'erxes-api-shared/utils';

export const types = `
  type MushopMembership {
    _id: String!
    customerId: String!
    planId: String
    plan: MushopMembershipPlan
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

  type MushopMembershipListResponse {
    list: [MushopMembership]
    pageInfo: PageInfo
    totalCount: Int
  }
`;

export const queries = `
  mushopMyMembership: MushopMembership
  mushopMemberships(searchValue: String, status: String, ${GQL_CURSOR_PARAM_DEFS}): MushopMembershipListResponse
  mushopMembershipDetail(_id: String!): MushopMembership
`;

export const mutations = `
  mushopCancelMyMembership(_id: String!): MushopMembership
  mushopCancelMembership(_id: String!): MushopMembership
  mushopGrantMembership(customerId: String!, planId: String!, paymentId: String, amount: Float): MushopMembership
  mushopUpdateMembershipEndDate(_id: String!, endDate: Date!): MushopMembership
  mushopUpdateMembershipStatus(_id: String!, status: String!): MushopMembership
`;
