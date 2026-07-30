export const CONTRACT_STATUS = {
  DRAFT: 'draft',
  SIGNED: 'signed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const CONTRACT_STATUS_OPTIONS = [
  { value: CONTRACT_STATUS.DRAFT, label: 'Draft' },
  { value: CONTRACT_STATUS.SIGNED, label: 'Signed' },
  { value: CONTRACT_STATUS.COMPLETED, label: 'Completed' },
  { value: CONTRACT_STATUS.CANCELLED, label: 'Cancelled' },
];

export const CONTRACT_STATUS_COLORS = {
  [CONTRACT_STATUS.DRAFT]: 'bg-gray-100 text-gray-800',
  [CONTRACT_STATUS.SIGNED]: 'bg-blue-100 text-blue-800',
  [CONTRACT_STATUS.COMPLETED]: 'bg-green-100 text-green-800',
  [CONTRACT_STATUS.CANCELLED]: 'bg-red-100 text-red-800',
};

export const CONTRACT_PARTY_TYPE = {
  CUSTOMER: 'customer',
  COMPANY: 'company',
} as const;

export const CONTRACT_PARTY_TYPE_OPTIONS = [
  { value: CONTRACT_PARTY_TYPE.CUSTOMER, label: 'Customer' },
  { value: CONTRACT_PARTY_TYPE.COMPANY, label: 'Company' },
];

export const CONTRACT_INTEREST_TYPE = {
  SIMPLE: 'SIMPLE',
  FLAT: 'FLAT',
  REDUCING: 'REDUCING',
} as const;

export const CONTRACT_INTEREST_TYPE_OPTIONS = [
  { value: CONTRACT_INTEREST_TYPE.SIMPLE, label: 'Simple' },
  { value: CONTRACT_INTEREST_TYPE.FLAT, label: 'Flat' },
  { value: CONTRACT_INTEREST_TYPE.REDUCING, label: 'Reducing' },
];

