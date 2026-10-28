import { GQL_CURSOR_PARAM_DEFS } from 'erxes-api-shared/utils';

const trDetailFields = `
  _id: String
  accountId: String
  transactionId: String
  originId: String
  originType: String
  originSubId: String
  followInfos: JSON
  placeEntityId: String
  responsibleEntityId: String

  amount: Float
  currencyAmount: Float
  customRate: Float
  assignedUserId: String

  productId: String
  count: Float
  unitPrice: Float
  weight: Float
  fixedAssetId: String
  fixedAssetCategoryId: String
  fixedAssetCode: String
  fixedAssetName: String

  excludeVat: Boolean
  excludeCtax: Boolean
`;

const transactionFields = `
  ptrId: String
  parentId: String
  number: String

  date: Date
  description: String
  journal: String
  status: String
  mentionOwnerId: String
  mentionUserIds: [String]
  side: String
  originType: String
  followInfos: JSON
  relAccounts: JSON

  placeEntityId: String
  responsibleEntityId: String
  customerType: String
  customerId: String
  assignedUserIds: [String]

  hasVat: Boolean
  vatRowId: String
  afterVat: Boolean
  isHandleVat: Boolean
  vatAmount: Float

  hasCtax: Boolean
  ctaxRowId: String
  isHandleCtax: Boolean
  ctaxAmount: Float

  extraData: JSON
  contentType: String
  contentId: String
`;

export const types = () => `
  type AccTrDetail {
    ${trDetailFields}

    account: Account
    placeEntity: StructureEntity
    responsibleEntity: StructureEntity
    product: Product
  }

  type AccCommonTransaction {
    _id: String

    ${transactionFields}

    ptrNumber: String
    ptrStatus: String

    createdAt: Date
    updatedAt: Date

    originId: String
    originSubId: String

    details: [AccTrDetail]
    shortDetail: AccTrDetail
    sumDt: Float
    sumCt: Float
    createdBy: String
    modifiedBy: String

    permission: String
    vatRow: VatRow
    ctaxRow: CtaxRow
    followTrs: [AccCommonTransaction]

    placeEntity: StructureEntity
    responsibleEntity: StructureEntity
    customer: AccCustomer

    ptrInfo: JSON
  }

  type AccCommonTrRecord {
    _id: String
    trId: String
    detailInd: Int

    ${transactionFields}

    ptrStatus: String
    ptrNumber: String

    createdAt: Date
    updatedAt: Date

    originId: String
    originSubId: String

    details: AccTrDetail
    shortDetail: AccTrDetail
    sumDt: Float
    sumCt: Float
    createdBy: String
    modifiedBy: String

    permission: String
    vatRow: VatRow
    ctaxRow: CtaxRow
    followTrs: [AccCommonTransaction]

    placeEntity: StructureEntity
    responsibleEntity: StructureEntity
    customer: AccCustomer
  }

  type AccTransactionsListResponse {
    list: [AccCommonTransaction],
    pageInfo: PageInfo
    totalCount: Int,
  }

  type AccTransactionsByContentResponse {
    list: [AccCommonTransaction],
    totalCount: Int,
  }

  type AccTrRecordsListResponse {
    list: [AccCommonTrRecord],
    pageInfo: PageInfo
    totalCount: Int,
  }

  input CommonTrDetailInput {
    ${trDetailFields}
  }

  input TransactionInput {
    _id: String
    ${transactionFields}

    details: [CommonTrDetailInput]
  }
`;

const trsQueryParams = `
  ids: [String],
  excludeIds: Boolean,
  status: String,
  mentionOwnerId: String,
  mentionUserId: String,
  searchValue: String,
  number: String,
  ptrStatus: String,
  customerType: String,
  customerId: String,
  contentType: String,
  contentId: String,

  accountIds: [String],
  accountKind: String,
  accountExcludeIds: Boolean,
  accountStatus: String,
  accountCategoryId: String,
  accountSearchValue: String,
  accountBrand: String,
  accountIsTemp: Boolean,
  accountIsOutBalance: Boolean,
  accountPlaceEntityId: String,
  accountResponsibleEntityId: String,
  accountCurrency: String,
  accountJournal: String,

  brandId: String,
  isTemp: Boolean,
  isOutBalance: Boolean,
  placeEntityId: String,
  responsibleEntityId: String,
  currency: String,
  journal: String,
  journals: [String],
  statuses: [String],
  relAccounts: [String],

  createdUserId: String,
  modifiedUserId: String,
  startDate: Date,
  endDate: Date,
  startUpdatedDate: Date,
  endUpdatedDate: Date,
  startCreatedDate: Date,
  endCreatedDate: Date,
`;

const trRecsQueryParams = `
  ${trsQueryParams}

  groupRule: [String],
  folded: Boolean,
`;

export const queries = `
  accTransactionsMain(
    ${trsQueryParams},
    ${GQL_CURSOR_PARAM_DEFS}
  ): AccTransactionsListResponse
  accTransactions(
    ${trsQueryParams},
    page: Int,
    perPage: Int,
    sortField: String
    sortDirection: Int
  ): [AccCommonTransaction]
  accTransactionsByContent(
    contentType: String!,
    contentId: String!,
    page: Int,
    perPage: Int,
    sortField: String
    sortDirection: Int
  ): AccTransactionsByContentResponse
  accTransactionsDetail(_id: String!): [AccCommonTransaction]
  accTransactionDetail(_id:String!): AccCommonTransaction
  accTransactionsCount(${trsQueryParams}): Int
  accTrRecordsMain(
    ${trRecsQueryParams},
    ${GQL_CURSOR_PARAM_DEFS}
  ): AccTrRecordsListResponse
  accTrRecords(
    ${trRecsQueryParams},
    page: Int,
    perPage: Int,
    sortField: String
    sortDirection: Int
  ): [AccCommonTrRecord]
  accTrRecordsCount(${trRecsQueryParams}): Int
  accOddTransactions: AccCommonTransaction @deprecated(reason: "Legacy placeholder; use accTransactions instead")
`;

export const mutations = `
  accTransactionsCreate(trDocs: [TransactionInput!]!): [AccCommonTransaction]
  accTransactionsUpdate(parentId: String!, trDocs: [TransactionInput!]!): [AccCommonTransaction]
  accTransactionsRemove(parentId: String, ptrId: String): JSON

  accTransactionsLink(trIds: [String!]!, ptrId: String!): [AccCommonTransaction]
`;
