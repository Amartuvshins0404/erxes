import { gql } from '@apollo/client';

export const MUSHOP_PRODUCT_SPECIFICATION = gql`
  query MushopProductSpecification($productId: String!, $code: String) {
    mushopProductSpecification(productId: $productId, code: $code) {
      _id
      productId
      code
      moq
      cnyCost
      profitPercent
      prepaymentPercent
    }
  }
`;

export const MUSHOP_PRODUCT_SPECIFICATION_SAVE = gql`
  mutation MushopProductSpecificationSave(
    $productId: String
    $code: String
    $input: MushopProductSpecificationInput!
  ) {
    mushopProductSpecificationSave(
      productId: $productId
      code: $code
      input: $input
    ) {
      _id
      productId
      moq
      cnyCost
      profitPercent
      prepaymentPercent
    }
  }
`;
