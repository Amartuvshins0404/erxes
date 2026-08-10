import { GQL_CURSOR_PARAM_DEFS } from 'erxes-api-shared/utils';

export const types = `
  type MushopOrderCustomer {
    _id: String
    firstName: String
    lastName: String
    primaryEmail: String
    primaryPhone: String
  }

  type MushopOrder {
    _id: String!
    subdomain: String
    order: JSON
    status: String
    entityId: String
    customerId: String
    customer: MushopOrderCustomer
    supplier: MushopSupplier
    error: String
    createdAt: Date
    updatedAt: Date
  }

  type MushopOrderListResponse {
    list: [MushopOrder]
    pageInfo: PageInfo
    totalCount: Int
  }
`;

const orderQueryParams = `
  status: String
  supplierId: String
  customerId: String
  entityId: String
  dateFilters: String
`;

export const queries = `
  mushopOrders(${orderQueryParams}${GQL_CURSOR_PARAM_DEFS}): MushopOrderListResponse
  mushopOrderDetail(_id: String!): MushopOrder
`;

export const mutations = `
  mushopResyncOrder(_id: String!): MushopOrder
`;
