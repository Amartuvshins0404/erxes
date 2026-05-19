export const types = `
  type BlockContractStatusType {
    _id: String!
    name: String!
    projectId: String!
    description: String
    color: String
    order: Int
    type: String
    createdAt: Date
    updatedAt: Date
  }

  input BlockContractStatusInput {
    _id: String
    name: String!
    projectId: String!
    description: String
    color: String
    type: String
  }
`;

export const queries = `
  getBlockContractStatus(_id: String!): BlockContractStatusType
  getBlockContractStatuses(projectId: String!): [BlockContractStatusType]
  getBlockContractStatusTypes: JSON
`;

export const mutations = `
  createBlockContractStatus(input: BlockContractStatusInput!): BlockContractStatusType
  updateBlockContractStatus(_id: String!, input: BlockContractStatusInput!): BlockContractStatusType
  updateBlockContractStatusOrder(_id: String!, order: Int!): BlockContractStatusType
  removeBlockContractStatus(_id: String!): BlockContractStatusType
`;
