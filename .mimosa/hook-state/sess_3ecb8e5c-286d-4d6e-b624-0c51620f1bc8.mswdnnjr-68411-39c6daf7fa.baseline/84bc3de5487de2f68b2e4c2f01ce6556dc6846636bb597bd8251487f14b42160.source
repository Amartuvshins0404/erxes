import { gql } from '@apollo/client';
import { GQL_CURSOR_PARAM_DEFS, GQL_CURSOR_PARAMS } from 'erxes-ui';

const BA_PRODUCT_FRAGMENT = gql`
  fragment BaProductFields on BaProduct {
    _id
    name
    shortName
    code
    type
    description
    barcodes
    variants
    barcodeDescription
    unitPrice
    initialCategory
    categoryId
    category {
      _id
      name
      code
    }
    vendorId
    supplier {
      _id
      name
      logo
    }
    propertiesData
    tagIds
    attachment
    attachmentMore
    scopeBrandIds
    uom
    subUoms
    currency
    pdfAttachment
    status
    createdAt
    updatedAt
  }
`;

export const BA_PRODUCT_CATEGORIES = gql`
  query BaProductCategories($searchValue: String) {
    productCategories(searchValue: $searchValue) {
      _id
      name
      code
      order
    }
  }
`;

export const BA_PRODUCTS = gql`
  query BaProducts(
    $supplierId: String
    $categoryId: String
    $status: String
    $searchValue: String
    ${GQL_CURSOR_PARAM_DEFS}
  ) {
    baProducts(
      supplierId: $supplierId
      categoryId: $categoryId
      status: $status
      searchValue: $searchValue
      ${GQL_CURSOR_PARAMS}
    ) {
      list {
        ...BaProductFields
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalCount
    }
  }
  ${BA_PRODUCT_FRAGMENT}
`;

export const BA_PRODUCT_DETAIL = gql`
  query BaProductDetail($_id: String!) {
    baProductDetail(_id: $_id) {
      ...BaProductFields
    }
  }
  ${BA_PRODUCT_FRAGMENT}
`;
