export const types = `
  type BlockCustomerSync {
    _id: String
    customerId: String
    blockAdminId: String
    createdAt: Date
    updatedAt: Date
  }
`;

export const queries = `
  blockGetCustomerSync(customerId: String!): BlockCustomerSync
`;

export const mutations = `
  blockSyncCustomer(customerId: String!): BlockCustomerSync
`;
