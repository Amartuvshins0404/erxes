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
  paid: boolean;
  paidAmount?: number;
  paidDate?: string;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
}
