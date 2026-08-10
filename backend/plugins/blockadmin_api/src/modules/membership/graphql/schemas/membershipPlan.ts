import { GQL_CURSOR_PARAM_DEFS } from 'erxes-api-shared/utils';

export const types = `
  type BaMembershipPlan {
    _id: String!
    name: String!
    description: String
    price: Float!
    currency: String
    durationMonths: Int
    isActive: Boolean
    createdAt: Date
    updatedAt: Date
  }

  type BaMembershipPlanListResponse {
    list: [BaMembershipPlan]
    pageInfo: PageInfo
    totalCount: Int
  }

  input BaMembershipPlanInput {
    name: String!
    description: String
    price: Float!
    currency: String
    durationMonths: Int
  }
`;

export const queries = `
  baMembershipPlans(searchValue: String, isActive: Boolean, ${GQL_CURSOR_PARAM_DEFS}): BaMembershipPlanListResponse
  baMembershipPlanDetail(_id: String!): BaMembershipPlan
`;

export const mutations = `
  baMembershipPlanCreate(doc: BaMembershipPlanInput!): BaMembershipPlan
  baMembershipPlanUpdate(_id: String!, doc: BaMembershipPlanInput!): BaMembershipPlan
  baMembershipPlanDeactivate(_id: String!): BaMembershipPlan
`;
