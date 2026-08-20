export const types = `
  type MtoTravelAssociation {
    _id: String
    createdAt: Date
    modifiedAt: Date
    title: MtoMultilingualString
    description: MtoMultilingualStringOptional
    logo: String
    cover: String
    foundDate: Date
  }
`;

const queryParams = `
  searchValue: String,
  foundDateFrom: Date,
  foundDateTo: Date,
`;

export const queries = `
  mtoTravelAssociations(${queryParams}): [MtoTravelAssociation]
  mtoTravelAssociation(_id: String!): MtoTravelAssociation
`;

export const mutations = `
  mtoTravelAssociationCreate(
    title: MtoMultilingualStringInput!
    description: MtoMultilingualStringOptionalInput
    logo: String
    cover: String
    foundDate: Date!
  ): MtoTravelAssociation

  mtoTravelAssociationUpdate(
    _id: String!
    title: MtoMultilingualStringInput
    description: MtoMultilingualStringOptionalInput
    logo: String
    cover: String
    foundDate: Date
  ): MtoTravelAssociation

  mtoTravelAssociationsRemove(ids: [String]!): JSON
`;
