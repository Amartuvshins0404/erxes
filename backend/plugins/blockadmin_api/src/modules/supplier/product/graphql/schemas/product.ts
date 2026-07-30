import { GQL_CURSOR_PARAM_DEFS } from 'erxes-api-shared/utils';

export const types = `
  type BaProductCategory {
    _id: String
    name: String
    code: String
    order: String
    parentId: String
  }

  type BaProduct {
    _id: String!
    name: String
    shortName: String
    code: String
    type: String
    description: String
    barcodes: [String]
    variants: JSON
    barcodeDescription: String
    unitPrice: Float
    initialCategory: JSON
    categoryId: String
    category: BaProductCategory
    vendorId: String
    supplier: BaSupplier
    propertiesData: JSON
    tagIds: [String]
    attachment: JSON
    attachmentMore: [JSON]
    scopeBrandIds: [String]
    uom: String
    subUoms: JSON
    currency: String
    pdfAttachment: JSON
    status: String
    state: String
    createdAt: Date
    updatedAt: Date
  }

  type BaProductListResponse {
    list: [BaProduct]
    pageInfo: PageInfo
    totalCount: Int
  }
`;

const productQueryParams = `
  supplierId: String
  categoryId: String
  status: String
  searchValue: String
`;

export const queries = `
  baProducts(${productQueryParams}${GQL_CURSOR_PARAM_DEFS}): BaProductListResponse
  baProductDetail(_id: String!): BaProduct
`;

export const mutations = `
  baUpdateProductStatus(_id: String!, status: String!, note: String): BaProduct
  baAssignProductCategory(_id: String!, categoryId: String): BaProduct
  baRemoveProduct(_id: String!): JSON
`;
