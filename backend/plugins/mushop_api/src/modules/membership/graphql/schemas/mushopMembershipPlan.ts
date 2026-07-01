import { GQL_CURSOR_PARAM_DEFS } from 'erxes-api-shared/utils';

export const types = `
  type MushopMembershipPlan {
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

  type MushopMembershipPlanListResponse {
    list: [MushopMembershipPlan]
    pageInfo: PageInfo
    totalCount: Int
  }

  input MushopMembershipPlanInput {
    name: String!
    description: String
    price: Float!
    currency: String
    durationMonths: Int
  }
`;

export const queries = `
  mushopMembershipPlans(searchValue: String, isActive: Boolean, ${GQL_CURSOR_PARAM_DEFS}): MushopMembershipPlanListResponse
  mushopMembershipPlanDetail(_id: String!): MushopMembershipPlan
`;

export const mutations = `
  mushopMembershipPlanCreate(doc: MushopMembershipPlanInput!): MushopMembershipPlan
  mushopMembershipPlanUpdate(_id: String!, doc: MushopMembershipPlanInput!): MushopMembershipPlan
  mushopMembershipPlanDeactivate(_id: String!): MushopMembershipPlan
`;
