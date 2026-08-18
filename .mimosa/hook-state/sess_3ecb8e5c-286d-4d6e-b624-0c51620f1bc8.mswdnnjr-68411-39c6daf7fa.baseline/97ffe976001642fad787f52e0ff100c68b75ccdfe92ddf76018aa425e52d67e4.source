import { IPageInfo } from 'ui-modules';

export const ORDER_STATUSES = [
  'pending',
  'forwarded',
  'cancelled',
  'failed',
] as const;

export type TOrderStatus = (typeof ORDER_STATUSES)[number];

export interface IOrderSupplier {
  _id: string;
  name?: string;
  code?: string;
  logo?: string;
}

export interface IOrderCustomer {
  _id: string;
  firstName?: string;
  lastName?: string;
  primaryEmail?: string;
  primaryPhone?: string;
}

export interface IOrderItemPayload {
  productId?: string;
  productName?: string;
  count?: number;
  unitPrice?: number;
  [key: string]: unknown;
}

export interface IOrderPayload {
  number?: string;
  status?: string;
  totalAmount?: number;
  finalAmount?: number;
  description?: string;
  items?: IOrderItemPayload[];
  [key: string]: unknown;
}

export interface IOrder {
  _id: string;
  subdomain?: string;
  order?: IOrderPayload;
  status?: TOrderStatus | string;
  entityId?: string;
  customerId?: string;
  customer?: IOrderCustomer;
  supplier?: IOrderSupplier;
  error?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IOrderList {
  list: IOrder[];
  pageInfo: IPageInfo;
  totalCount?: number;
}
