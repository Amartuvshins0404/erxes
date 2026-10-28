export const types = `
  type SafeRemainder @key(fields: "_id") {
    _id: String!
    placeEntity: StructureEntity
    placeEntityId: String
    productCategory: ProductCategory
    attachment: Attachment
    filterField: String
    productCategoryId: String

    date: Date
    description: String
    status: String    

    incomeRule: JSON
    incomeTrId: String
    outRule: JSON
    outTrId: String
    saleRule: JSON
    saleTrId: String
    costIncreaseRule: JSON
    costDecreaseRule: JSON
    costIncreaseTrId: String
    costDecreaseTrId: String

    createdAt: Date
    createdBy: String
    modifiedAt: Date
    modifiedBy: String
    modifiedUser: User
  }

  type SafeRemainders {
    remainders: [SafeRemainder],
    totalCount: Float,
  }

  input SafeRemainderSubmitProduct {
    transactionId: String
    productId: String
    preCount: Float
    count: Float
    uom: String
    isDebit: Boolean
  }
`;

export const queries = `
  safeRemainders(
    placeEntityId: String,
    productId: String,
    searchValue: String,
    beginDate: Date,
    endDate: Date,
    createdUserId: String,
    modifiedUserId: String,
    createdStartDate: Date,
    createdEndDate: Date,
    updatedStartDate: Date,
    updatedEndDate: Date,
    page: Int,
    perPage: Int,
    sortField: String,
    sortDirection: Int,
  ): SafeRemainders
  safeRemainderDetail(_id: String!): SafeRemainder
`;

export const mutations = `
  safeRemainderAdd(
    placeEntityId: String,
    date: Date,
    description: String,
    productCategoryId: String,
    attachment: AttachmentInput,
    filterField: String,
    items: JSON
  ): SafeRemainder
  safeRemainderEdit(_id: String!, description: String, incomeRule: JSON, outRule: JSON, saleRule: JSON, costIncreaseRule: JSON, costDecreaseRule: JSON): SafeRemainder
  safeRemainderRemove(_id: String!): JSON
  safeRemainderReCalc(_id: String!): String
  safeRemainderSubmit(_id: String!): SafeRemainder
  safeRemainderCancel(_id: String!): SafeRemainder
  safeRemainderDoTr(_id: String!): SafeRemainder
  safeRemainderUndoTr(_id: String!): SafeRemainder
`;
