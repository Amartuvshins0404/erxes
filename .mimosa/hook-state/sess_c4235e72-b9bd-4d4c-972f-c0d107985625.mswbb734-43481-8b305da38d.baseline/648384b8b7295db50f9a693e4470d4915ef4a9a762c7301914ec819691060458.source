export const PromoCodeDiscountType = {
  PERCENT: 'percent',
  FIXED: 'fixed',
} as const;

export type PromoCodeDiscountTypeValue =
  (typeof PromoCodeDiscountType)[keyof typeof PromoCodeDiscountType];

export interface OneFitPromoCode {
  _id: string;
  createdAt: string;
  modifiedAt: string;
  code: string;
  discountType: string;
  value: number;
  isCompanyTag: boolean;
  validFrom?: string;
  validTo?: string;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
}

export interface OneFitPromoCodeListResponse {
  list: OneFitPromoCode[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor?: string;
    endCursor?: string;
  };
  totalCount: number;
}

export interface PromoCodeFilters {
  code?: string;
  isActive?: boolean;
  validNow?: boolean;
}
