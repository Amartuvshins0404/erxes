import { IContract, IContractDocument } from '@/contract/@types/contract';

// block-admin only knows the semantic status type (draft/signed/...), not
// this org's own custom ContractStatus _id, so the mirrored payload must
// carry the resolved type instead of the raw reference.
export const buildContractMirrorInput = (
  contract: IContractDocument,
  statusType: IContract['status'],
): IContract => ({
  _id: contract._id,
  unit: String(contract.unit),
  number: contract.number,
  currency: contract.currency,
  date: contract.date,
  amount: contract.amount,
  customerId: contract.customerId,
  paymentPlan: contract.paymentPlan,
  user: contract.user,
  description: contract.description,
  status: statusType,
});
