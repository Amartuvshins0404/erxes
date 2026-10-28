export const types = `
  type ReserveRem @key(fields: "_id") @cacheControl(maxAge: 3) {
    _id: String,
    placeEntityId: String,
    productId: String,
    uom: String,
    remainder: Float
    createdAt: Date,
    createdBy: String,
    modifiedAt: Date,
    modifiedBy: String,

    placeEntity: StructureEntity
    product: Product,
    createdUser: User,
    modifiedUser: User
  }
`;

export const paginateParams = `
  page: Int,
  perPage: Int,
  sortField: String,
  sortDirection: Int,
`;

export const planFilterParams = `
  _ids:[String],
  searchValue: String,
  placeEntityId: String,
  productId: String,
  productCategoryId: String,
  remainder: Float,
  dateType: String,
  startDate: Date,
  endDate: Date,
`;

export const queries = `
  reserveRems(${planFilterParams}, ${paginateParams}): [ReserveRem],
  reserveRemsCount(${planFilterParams}, ${paginateParams}): Int,
`;

export const planCreateParams = `
  placeEntityIds: [String],
  productCategoryId: String,
  productId: String,
  remainder: Float
`;

export const mutations = `
  reserveRemsAdd(${planCreateParams}): [ReserveRem]
  reserveRemsRemove(_ids: [String!]!): JSON
  reserveRemEdit(_id: String!, placeEntityId: String, productId: String, uom: String, remainder: Float): ReserveRem
`;
