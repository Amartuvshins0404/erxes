export const types = `
  type BlockAdminUnit {
    _id: String
    building: String
    buildingData: BlockAdminBuilding
    zoning: String
    zoningData: BlockAdminBuildingZoning
    number: String
    status: BlockAdminUnitStatus
    isFeatured: Boolean
    leads: [String]

    projectData: BlockAdminProject

    type: String
    unitType: BlockAdminUnitType
    agencySubdomain: String
    agencyEntityId: String
    locked: Boolean
    createdAt: Date
    updatedAt: Date
  }

  input BlockAdminUnitInput {
    isFeatured: Boolean
    type: String
  }
`;

export const queries = `
  blockAdminGetUnit(_id: String!): BlockAdminUnit
  blockAdminGetUnits(zoning: String!): [BlockAdminUnit]
`;

export const mutations = `
  blockAdminUpdateUnit(_id: String!, input: BlockAdminUnitInput): BlockAdminUnit
`;
