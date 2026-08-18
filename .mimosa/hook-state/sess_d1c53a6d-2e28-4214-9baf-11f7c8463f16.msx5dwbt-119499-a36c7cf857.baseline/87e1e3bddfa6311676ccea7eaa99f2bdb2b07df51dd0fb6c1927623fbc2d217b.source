import { gql } from '@apollo/client';
import { GQL_CURSOR_PARAM_DEFS, GQL_CURSOR_PARAMS } from 'erxes-ui';

export const ONE_FIT_PROMO_CODES = gql`
  query OneFitPromoCodes(
    $code: String
    $isActive: Boolean
    $validNow: Boolean
    ${GQL_CURSOR_PARAM_DEFS}
  ) {
    oneFitPromoCodes(
      code: $code
      isActive: $isActive
      validNow: $validNow
      ${GQL_CURSOR_PARAMS}
    ) {
      list {
        _id
        createdAt
        modifiedAt
        code
        discountType
        value
        isCompanyTag
        validFrom
        validTo
        usageLimit
        usedCount
        isActive
      }
      totalCount
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`;

export const ONE_FIT_PROMO_CODES_COUNT = gql`
  query OneFitPromoCodesCount(
    $code: String
    $isActive: Boolean
    $validNow: Boolean
  ) {
    oneFitPromoCodesCount(code: $code, isActive: $isActive, validNow: $validNow)
  }
`;

export const ONE_FIT_PROMO_CODE = gql`
  query OneFitPromoCode($_id: String!) {
    oneFitPromoCode(_id: $_id) {
      _id
      createdAt
      modifiedAt
      code
      discountType
      value
      isCompanyTag
      validFrom
      validTo
      usageLimit
      usedCount
      isActive
    }
  }
`;
