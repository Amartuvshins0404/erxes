export const types = `
  type MtoCategory {
    _id: String
    name: MtoMultilingualString
    logo: String
    level: String
    parentId: String
    parent: MtoCategory
    isActive: Boolean
    createdAt: Date
    modifiedAt: Date
  }
`;

export const queries = `
  mtoCategories(isActive: Boolean, parentId: String, onlyTopLevel: Boolean, level: String): [MtoCategory]
  mtoCategory(_id: String!): MtoCategory
`;

export const mutations = `
  mtoCategoryCreate(name: MtoMultilingualStringInput!, logo: String, level: String, parentId: String, isActive: Boolean): MtoCategory
  mtoCategoryUpdate(_id: String!, name: MtoMultilingualStringInput, logo: String, level: String, parentId: String, isActive: Boolean): MtoCategory
  mtoCategoriesRemove(ids: [String]!): JSON
`;
