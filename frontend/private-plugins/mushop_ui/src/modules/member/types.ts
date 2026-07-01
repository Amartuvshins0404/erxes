import { IPageInfo } from 'ui-modules';

export interface IMembershipPlan {
  _id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  durationMonths: number;
  isActive?: boolean;
}

export interface IMember {
  _id: string;
  customerId: string;
  planId?: string;
  plan?: IMembershipPlan;
  status?: string;
  startDate?: string;
  endDate?: string;
  amount?: number;
  currency?: string;
  invoiceId?: string;
  customer?: {
    _id: string;
    firstName?: string;
    lastName?: string;
    primaryEmail?: string;
    primaryPhone?: string;
    avatar?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface IMemberList {
  list: IMember[];
  pageInfo: IPageInfo;
  totalCount?: number;
}

export interface IPaymentMethod {
  _id: string;
  name: string;
  kind: string;
  status?: string | null;
}
