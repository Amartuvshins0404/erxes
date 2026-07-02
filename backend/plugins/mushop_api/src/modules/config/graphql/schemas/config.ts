export const types = `
  type MushopConfig {
    _id: String!
    code: String!
    value: Float
    createdAt: Date
    updatedAt: Date
  }
`;

export const queries = `
  mushopConfig(code: String!): MushopConfig
  mushopConfigs(codes: [String!]!): [MushopConfig!]!
`;

export const mutations = `
  mushopConfigSave(code: String!, value: Float): MushopConfig
`;
