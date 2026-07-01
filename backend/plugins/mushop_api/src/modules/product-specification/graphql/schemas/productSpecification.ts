export const types = `
  type MushopProductSpecification {
    _id: String!
    productId: String
    code: String
    moq: Float
    cnyCost: Float
    profitPercent: Float
    prepaymentPercent: Float
    createdAt: Date
    updatedAt: Date
  }

  input MushopProductSpecificationInput {
    moq: Float
    cnyCost: Float
    profitPercent: Float
    prepaymentPercent: Float
  }
`;

export const queries = `
  mushopProductSpecification(productId: String!, code: String): MushopProductSpecification
`;

export const mutations = `
  mushopProductSpecificationSave(productId: String, code: String, input: MushopProductSpecificationInput!): MushopProductSpecification
`;
