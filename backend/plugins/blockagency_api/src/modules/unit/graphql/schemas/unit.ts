export const types = `
  enum BlockUnitStatus {
    vacant
    reserved
    leased
    leaseExpireSoon
    leaseRenewal
    underFitout
    cancelled
    internalUse
    onHold
  }

  type BlockAgencyUnitAgency {
    name: String
  }

  type BlockAgencyUnitStatusCount {
    available: Int!
    reserved: Int!
    sold: Int!
    leased: Int!
  }

  type BlockAgencyUnit {
    _id: String!
    blockUnitId: String!
    agencyId: String!
    blockSubdomain: String!
    agencySubdomain: String!
    blockDeveloperName: String
    unitNumber: String
    projectId: String
    memberId: String
    member: User @provides(fields: "_id")
    status: BlockUnitStatus
    assignedAt: Date
    createdAt: Date
    updatedAt: Date
    agency: BlockAgencyUnitAgency
  }
`;

export const queries = `
  blockAgencyGetUnits(agencyId: String, projectId: String, memberId: String, status: BlockUnitStatus, page: Int, perPage: Int): [BlockAgencyUnit]
  blockAgencyGetUnitsTotalCount(agencyId: String, projectId: String, memberId: String, status: BlockUnitStatus): Int
  blockAgencyGetUnitStatusCounts(agencyId: String, projectId: String): BlockAgencyUnitStatusCount
`;

export const mutations = `
  blockAgencyAssignUnitToMember(_id: String!, memberId: String): BlockAgencyUnit
  blockAgencyUpdateUnitStatus(_id: String!, status: BlockUnitStatus!): BlockAgencyUnit
  blockAgencyRemoveUnit(_id: String!): Boolean
`;
