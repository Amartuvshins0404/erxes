export enum OneFitMembershipStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  NONE = 'none',
}

export interface OneFitBookingPreferences {
  preferredTimeSlots?: string[];
  preferredDays?: string[];
  notificationEnabled?: boolean;
}

export interface OneFitCustomer {
  _id: string;
  createdAt: string;
  updatedAt: string;
  // Base customer fields
  firstName?: string;
  lastName?: string;
  primaryEmail?: string;
  primaryPhone?: string;
  // OneFit-specific fields (matching GraphQL response with oneFit prefix)
  oneFitMembershipPlanId?: string;
  oneFitMembershipExpiresAt?: string;
  oneFitMembershipStatus?: OneFitMembershipStatus;
  graceMode?: boolean;
  oneFitIsMembershipOnHold?: boolean;
  oneFitMembershipHoldStartAt?: string;
  oneFitMembershipHoldEndAt?: string;
  oneFitMembershipHoldEndedAt?: string;
  oneFitCurrentCreditBalance?: number;
  oneFitTotalCreditsEarned?: number;
  oneFitTotalCreditsUsed?: number;
  oneFitPreferredActivityTypes?: string[];
  oneFitBookingPreferences?: OneFitBookingPreferences;
  oneFitLastBookingDate?: string;
  oneFitTotalBookings?: number;
  oneFitPaidNotActivatedPurchasesCount?: number;
}

export interface OneFitCustomerListResponse {
  list: OneFitCustomer[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor?: string;
    endCursor?: string;
  };
  totalCount: number;
}

export interface OneFitCustomerFilters {
  searchValue?: string;
  phone?: string;
  email?: string;
  membershipPlanId?: string;
  membershipStatus?: OneFitMembershipStatus;
  graceMode?: boolean;
  minCreditBalance?: number;
  maxCreditBalance?: number;
  preferredActivityTypeId?: string;
  type?: 'onefit' | 'erxes';
}
