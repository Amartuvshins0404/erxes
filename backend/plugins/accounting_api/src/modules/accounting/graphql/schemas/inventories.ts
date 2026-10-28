export const types = `
  type AccountingInvCostSubInfo {
    remainder: Float
    cost: Float
  }

  type AccCurrentCost {
    productId: String!
    unitCost: Float!
    remainder: Float!
    totalCost: Float!
  }

  type AccountingLastIncomePrice {
    productId: String!
    unitPrice: Float!
  }
`;

export const queries = `
  getAccLastIncomePrice(productIds: [String!]!): [AccountingLastIncomePrice!]!
  getAccCurrentCost(productIds: [String!]!, accountId: String!, placeEntityId: String, excludedTransactionIds: [String!]): [AccCurrentCost!]!
`;

export const mutations = `
  
`;
