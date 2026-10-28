import { GQL_CURSOR_PARAM_DEFS } from 'erxes-api-shared/utils';

export const types = `

  type SalesPipeline @key(fields: "_id") {
    _id: String!
    name: String!
    status: String
    boardId: String!
    tagId: String
    tag: Tag
    visibility: String!
    memberIds: [String]
    sharedEntityIds: [String]
    members: [User]
    bgColor: String
    isWatched: Boolean
    itemsTotalCount: Int
    userId: String
    createdUser: User
    startDate: Date
    endDate: Date
    metric: String
    hackScoringType: String
    templateId: String
    state: String
    isCheckDate: Boolean
    accessRule: SalesPipelineAccessRule
    numberConfig: String
    numberSize: String
    nameConfig: String
    initialCategoryIds: [String]
    excludeCategoryIds: [String]
    excludeProductIds: [String]
    paymentIds: [String]
    paymentTypes: JSON
    propertyIds: [String]
    isPropertySelectionConfigured: Boolean
    order: Int
    createdAt: Date
    type: String

    cursor: String
  }

  type SalesPipelinesListResponse {
    list: [SalesPipeline],
    pageInfo: PageInfo
    totalCount: Int,
  }

  type SalesPipelineAccessRule {
    scope: String
    exemptUserIds: [String]
  }

  input SalesPipelineAccessRuleInput {
    scope: String
    exemptUserIds: [String]
  }

  input SalesOrderItem {
    _id: String!
    order: Int!
  }
`;

const queryParams = `
  boardId: String,
  isAll: Boolean

  ${GQL_CURSOR_PARAM_DEFS}
`;

export const queries = `
  salesPipelines(${queryParams}): SalesPipelinesListResponse
  salesPipelineDetail(_id: String!): SalesPipeline
  salesPipelineAssignedUsers(_id: String!): [User]
  salesPipelineStateCount(boardId: String): JSON
  cpSalesPipelines(${queryParams}): SalesPipelinesListResponse
`;

const mutationParams = `
  name: String!,
  boardId: String!,
  stages: JSON,
  visibility: String!,
  memberIds: [String],
  tagId: String,
  bgColor: String,
  startDate: Date,
  endDate: Date,
  metric: String,
  hackScoringType: String,
  templateId: String,
  isCheckDate: Boolean
  accessRule: SalesPipelineAccessRuleInput,
  numberConfig: String,
  numberSize: String,
  nameConfig: String,
  sharedEntityIds: [String],
  initialCategoryIds: [String]
  excludeCategoryIds: [String]
  excludeProductIds: [String]
  paymentIds: [String]
  paymentTypes: JSON
  propertyIds: [String]
`;

export const mutations = `
  salesPipelinesAdd(${mutationParams}): SalesPipeline
  salesPipelinesEdit(_id: String!, ${mutationParams}): SalesPipeline
  salesPipelinesUpdateOrder(orders: [SalesOrderItem]): [SalesPipeline]
  salesPipelinesWatch(_id: String!, isAdd: Boolean): SalesPipeline
  salesPipelinesRemove(_id: String!): JSON
  salesPipelinesArchive(_id: String!): JSON
  salesPipelinesCopied(_id: String!): JSON
`;
