import { OneFitMembershipPlan } from '~/modules/membership/types/membership';

export interface OneFitMembershipPurchaseUser {
  _id: string;
  firstName?: string;
  lastName?: string;
  primaryEmail?: string;
  primaryPhone?: string;
}

export interface OneFitMembershipPurchasePromoCode {
  _id: string;
  code: string;
}

export interface OneFitMembershipPurchaseCompany {
  _id: string;
  primaryName?: string;
}

export interface OneFitMembershipPurchase {
  _id: string;
  createdAt: string;
  modifiedAt: string;
  userId: string;
  companyId?: string;
  user?: OneFitMembershipPurchaseUser;
  company?: OneFitMembershipPurchaseCompany;
  planId: string;
  status: 'pending' | 'paid' | 'cancelled' | 'failed';
  purchasedAt: string;
  paidAt?: string;
  activatedAt?: string;
  expiresAt?: string;
  amount: number;
  invoiceId?: string;
  promoCodeId?: string;
  promoCode?: OneFitMembershipPurchasePromoCode;
  plan?: OneFitMembershipPlan;
  invoice?: any;
  deletedAt?: string;
}

export interface OneFitMembershipPurchaseListResponse {
  list: OneFitMembershipPurchase[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor?: string;
    endCursor?: string;
  };
  totalCount: number;
}

export interface MembershipPurchaseFilters {
  userId?: string;
  companyId?: string;
  status?: string;
  planId?: string;
  isActivated?: boolean;
  isPaidNotActivated?: boolean;
  isNeedActivation?: boolean;
  sortField?:
    | 'createdAt'
    | 'purchasedAt'
    | 'paidAt'
    | 'activatedAt'
    | 'expiresAt'
    | 'amount';
  sortDirection?: 'asc' | 'desc';
}
