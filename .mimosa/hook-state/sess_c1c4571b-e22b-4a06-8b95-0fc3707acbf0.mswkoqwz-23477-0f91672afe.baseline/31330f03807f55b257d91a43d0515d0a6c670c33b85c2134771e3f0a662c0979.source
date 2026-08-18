export enum OneFitCreditTransactionType {
  PURCHASE = 'purchase',
  USAGE = 'usage',
  REFUND = 'refund',
  EXPIRATION = 'expiration',
}

export enum OneFitCreditSource {
  INDIVIDUAL = 'individual',
  CORPORATE = 'corporate',
}

export interface OneFitCustomer {
  _id: string;
  createdAt: string;
  updatedAt: string;
  firstName?: string;
  lastName?: string;
  primaryEmail?: string;
  primaryPhone?: string;
}

export interface OneFitCreditTransaction {
  _id: string;
  createdAt: string;
  userId: string;
  customer?: OneFitCustomer;
  amount: number;
  transactionType: OneFitCreditTransactionType;
  source: OneFitCreditSource;
  bookingId?: string;
  corporateCreditId?: string;
  companyId?: string;
  description?: string;
  balanceAfter: number;
}

export interface OneFitCreditTransactionListResponse {
  list: OneFitCreditTransaction[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor?: string;
    endCursor?: string;
  };
  totalCount: number;
}

export interface OneFitCreditBalance {
  userId: string;
  customer?: OneFitCustomer;
  balance: number;
  individualBalance: number;
  corporateBalance: number;
}

export interface CreditTransactionFilters {
  userId?: string;
  transactionType?: OneFitCreditTransactionType;
  source?: OneFitCreditSource;
  bookingId?: string;
}
