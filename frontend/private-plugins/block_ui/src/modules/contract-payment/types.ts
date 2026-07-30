export type ContractPaymentStatus = 'unpaid' | 'partial' | 'paid';

export type ContractPaymentStatus = 'unpaid' | 'partial' | 'paid';

export interface IContractPayment {
  _id: string;
  contractId: string;
  contractNumber?: string;
  partyId?: string;
  partyType?: string;
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
