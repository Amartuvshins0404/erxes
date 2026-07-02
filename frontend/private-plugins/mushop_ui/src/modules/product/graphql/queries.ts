import { gql } from '@apollo/client';
import { GQL_CURSOR_PARAM_DEFS, GQL_CURSOR_PARAMS } from 'erxes-ui';

const MUSHOP_PRODUCT_FRAGMENT = gql`
  fragment MushopProductFields on MushopProduct {
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

export const PRODUCT_CATEGORIES = gql`
  query ProductCategories($searchValue: String) {
    productCategories(searchValue: $searchValue) {
      _id
      name
      code
      order
    }
  }
`;

export const MUSHOP_PRODUCTS = gql`
  query MushopProducts(
    $supplierId: String
    $categoryId: String
    $status: String
    $searchValue: String
    ${GQL_CURSOR_PARAM_DEFS}
  ) {
    mushopProducts(
      supplierId: $supplierId
      categoryId: $categoryId
      status: $status
      searchValue: $searchValue
      ${GQL_CURSOR_PARAMS}
    ) {
      list {
        ...MushopProductFields
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
  ${MUSHOP_PRODUCT_FRAGMENT}
`;

export const MUSHOP_PRODUCTS_TOTAL_COUNT = gql`
  query MushopProductsTotalCount(
    $supplierId: String
    $categoryId: String
    $status: String
    $searchValue: String
  ) {
    mushopProductsTotalCount(
      supplierId: $supplierId
      categoryId: $categoryId
      status: $status
      searchValue: $searchValue
    )
  }
`;

export const MUSHOP_PRODUCT_DETAIL = gql`
  query MushopProductDetail($_id: String!) {
    mushopProductDetail(_id: $_id) {
      ...MushopProductFields
    }
  }
  ${MUSHOP_PRODUCT_FRAGMENT}
`;
