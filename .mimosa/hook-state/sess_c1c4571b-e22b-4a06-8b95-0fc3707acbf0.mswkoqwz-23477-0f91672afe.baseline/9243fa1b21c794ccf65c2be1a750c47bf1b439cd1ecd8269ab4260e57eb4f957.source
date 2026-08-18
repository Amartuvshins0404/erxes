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
  pausedDaysRemaining?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface IPaymentMethod {
  _id: string;
  name: string;
  kind: string;
  status?: string;
}

export interface IMemberList {
  list: IMember[];
  pageInfo: IPageInfo;
  totalCount?: number;
}

export interface IPlanList {
  list: IMembershipPlan[];
  pageInfo?: IPageInfo;
  totalCount?: number;
}
