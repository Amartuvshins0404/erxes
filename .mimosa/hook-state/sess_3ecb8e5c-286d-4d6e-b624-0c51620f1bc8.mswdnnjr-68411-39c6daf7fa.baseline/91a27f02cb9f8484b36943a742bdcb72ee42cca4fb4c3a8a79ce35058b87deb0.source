/** Matches GraphQL enum OneFitMembershipPlanType */
export const OneFitMembershipPlanType = {
  NORMAL: 'normal',
  CREDIT: 'credit',
} as const;

export type OneFitMembershipPlanTypeValue =
  (typeof OneFitMembershipPlanType)[keyof typeof OneFitMembershipPlanType];

export interface OneFitMembershipPlan {
  _id: string;
  createdAt: string;
  modifiedAt: string;
  name: string;
  description?: string;
  creditAmount: number;
  planType?: OneFitMembershipPlanTypeValue;
  duration?: number;
  price: number;
  saleOptions?: OneFitMembershipSaleOption[];
  isActive: boolean;
}

export interface OneFitMembershipSaleOption {
  quantity: number;
  discountPercent?: number;
  finalPrice?: number;
}

export interface OneFitMembershipPlanListResponse {
  list: OneFitMembershipPlan[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor?: string;
    endCursor?: string;
  };
  totalCount: number;
}

export interface MembershipPlanFilters {
  searchValue?: string;
  isActive?: boolean;
  planType?: OneFitMembershipPlanTypeValue;
}
