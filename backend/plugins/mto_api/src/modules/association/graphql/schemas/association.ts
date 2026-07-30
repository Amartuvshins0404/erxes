export const types = `
  input MtoAssociationNameInput {
    en: String!
    mn: String!
  }
`;

export const queries = `
  mtoAssociations(isActive: Boolean, parentId: String, onlyTopLevel: Boolean, level: String): [MtoActivityAssociation]
  mtoAssociation(_id: String!): MtoActivityAssociation
`;

export const mutations = `
  mtoAssociationCreate(name: MtoAssociationNameInput!, logo: String, level: String, parentId: String, isActive: Boolean): MtoActivityAssociation
  mtoAssociationUpdate(_id: String!, name: MtoAssociationNameInput, logo: String, level: String, parentId: String, isActive: Boolean): MtoActivityAssociation
  mtoAssociationsRemove(ids: [String]!): JSON
`;
