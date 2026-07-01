import { GQL_CURSOR_PARAM_DEFS } from 'erxes-api-shared/utils';

export const types = `
  enum Priority {
    low
    medium
    high
  }

  type PropertyRow {
    buildingId: String
    zoningId: String
    unitId: String
    isMain: Boolean
  }

  input PropertyRowInput {
    buildingId: String
    zoningId: String
    unitId: String
    isMain: Boolean
  }

  type BlockOppty {
    _id: String
    number: String
    description: String
    customerId: String
    unitType: String
    tenureType: String
    unit: String
    units: [String]
    propertyRows: [PropertyRow]
    assignedUserId: String
    status: String
    labelIds: [String]
    tagIds: [String]
    projectId: String
    priority: Priority
    startDate: Date
    targetDate: Date
    customerSource: String
    propertiesData: JSON
    createdAt: Date
    updatedAt: Date
  }

  input IBlockOpptyInput{
    number: String
    description: String
    customerId: String
    unitType: String
    tenureType: String
    units: [String]
    unit: String
    propertyRows: [PropertyRowInput]
    assignedUserId: String
    status: String
    labelIds: [String]
    tagIds: [String]
    startDate: Date
    targetDate: Date
    customerSource: String
    projectId: String
    priority: Priority
    propertiesData: JSON
    # timer nemn
    # chosenUnit
    # activity
  }

  input IOpptyFilter {
    searchValue: String
    number: String
    description: String
    customerId: String
    unitType: String
    tenureType: String
    unit: String
    assignedUserId: String
    status: String
    priority: String
    startDate: Date
    targetDate: Date
    dateFilters: String
    customerSource: String
    labelId: String
    tagId: String
    ${GQL_CURSOR_PARAM_DEFS}
  }

  type BlockOpptyUnitRow {
    unitId: String
    buildingId: String
    zoningId: String
  }

  type BlockOpptyListResponse {
    list: [BlockOppty]
    pageInfo: PageInfo
    totalCount: Int
  }

  type OpptySubscription {
    type: String
    oppty: BlockOppty
  }

`;

export const queries = `
  blockGetOppty(_id: String!): BlockOppty
  blockGetOpptys(projectId: String!, filter: IOpptyFilter): BlockOpptyListResponse
  blockGetOpptyUnitRows(_id: String!): [BlockOpptyUnitRow]
  blockGetUnitOpptyOverview(unitId: String!, projectId: String!): BlockUnitOpptyOverview
`;

export const opptyOverviewType = `
  type BlockUnitOpptyOverview {
    total: Int
    stages: [BlockOverviewStageCount]
  }
`;

export const mutations = `
  blockCreateOppty(input: IBlockOpptyInput!): BlockOppty
  blockUpdateOppty(_id: String!, input: IBlockOpptyInput!): BlockOppty
  blockDeleteOppty(_id: String!): BlockOppty
  blockOpptyConvertToContract(_id: String!, unit: String!, paymentPlan: BlockProjectPaymentPlanInput!): String
`;
