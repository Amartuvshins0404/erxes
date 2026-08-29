export type ContractPaymentStatus = 'unpaid' | 'partial' | 'paid';

export interface IContractPayment {
  _id: string;
  contractId: string;
  contractNumber?: string;
  customerId?: string;
  projectId?: string;
  unit?: string;
  index: number;
  label?: string;
  dueDate?: string;
  amount: number;
  currency?: string;
  status: ContractPaymentStatus;
  paidAmount?: number;
  paidDate?: string;
  note?: string;
  penaltyAmount?: number;
  overdueDays?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface IContractPaymentTransaction {
  _id: string;
  paymentId: string;
  contractId: string;
  amount: number;
  date: string;
  note?: string;
  createdBy?: string;
  paymentMethod?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IContractPaymentSettings {
  _id: string;
  // `null` on the org-wide default; a project id when this project overrides it.
  projectId?: string | null;
  paymentIds?: string[];
  allowPartial?: boolean;
  updatedAt?: string;
}

export interface IPaymentMethod {
  _id: string;
  name: string;
  kind: string;
  status: string;
}
