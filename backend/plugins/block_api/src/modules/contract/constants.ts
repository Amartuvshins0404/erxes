export const CONTRACT_PARTY_TYPE = {
  CUSTOMER: 'customer',
  COMPANY: 'company',
};

export const CONTRACT_TYPE = {
  PRE_ORDER: 'reservation', // Урьдчилан Захиалгын гэрээ
  APARTMENT_PRE_ORDER: 'pre-sale', // Захиалгын гэрээ (орон сууц захиалгын гэрээ)
  HIRE_PURCHASE: 'hire-purchase', // Хувь лизинг (зээлээр хэсэгчилсэн төлбөр)
  LOAN_PRE_ORDER: 'loan-reservation', // Зээлээр захиалан бариулах гэрээ
  INTEREST_FREE_HIRE: 'interest-free-hire', // Хувь Лизинг (хүүгүй)
  BARTER: 'barter', // Арилжааны гэрээ (Бартер буюу мөнгөн бус төлбөр)
  BANK_HOUSING_LOAN: 'bank-housing-loan', // Банкны орон сууцны зээл
  BANK_MORTGAGE: 'bank-mortgage', // Банкны моргейж зээл (6%, 8% гэх мэт)
  SALE: 'sale', // Худалдах, худалдан авах гэрээ
  SALE_BARTER: 'sale-barter', // Худалдах, худалдан авах гэрээ (бартер, мөнгөн бус төлбөр)
};

export const CONTRACT_STATUS = {
  DRAFT: 'draft',
  SIGNED: 'signed',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
};

export const DEFAULT_CONTRACT_STATUS_TYPES = {
  RESERVED: 'reserved',
  DRAFT: 'draft',
  SIGNED: 'signed',
  LOST: 'lost',
  CANCELLED: 'cancelled',
};

export const TERMINAL_CONTRACT_STATUS_TYPES = [
  DEFAULT_CONTRACT_STATUS_TYPES.LOST,
  DEFAULT_CONTRACT_STATUS_TYPES.CANCELLED,
];

export const DEFAULT_CONTRACT_STATUSES = {
  [DEFAULT_CONTRACT_STATUS_TYPES.RESERVED]: {
    RESERVED: {
      name: 'Reserved',
      color: '#FFB347',
      type: DEFAULT_CONTRACT_STATUS_TYPES.RESERVED,
    },
  },
  [DEFAULT_CONTRACT_STATUS_TYPES.DRAFT]: {
    DRAFT: {
      name: 'Draft',
      color: '#4ECDC4',
      type: DEFAULT_CONTRACT_STATUS_TYPES.DRAFT,
    },
  },
  [DEFAULT_CONTRACT_STATUS_TYPES.SIGNED]: {
    SIGNED: {
      name: 'Signed',
      color: '#45B7D1',
      type: DEFAULT_CONTRACT_STATUS_TYPES.SIGNED,
    },
  },
  [DEFAULT_CONTRACT_STATUS_TYPES.LOST]: {
    LOST: {
      name: 'Lost',
      color: '#D9534F',
      type: DEFAULT_CONTRACT_STATUS_TYPES.LOST,
    },
  },
  [DEFAULT_CONTRACT_STATUS_TYPES.CANCELLED]: {
    CANCELLED: {
      name: 'Cancelled',
      color: '#C0392B',
      type: DEFAULT_CONTRACT_STATUS_TYPES.CANCELLED,
    },
  },
};

export const DEFAULT_CONTRACT_STATUS_TYPE_VALUES = {
  [DEFAULT_CONTRACT_STATUS_TYPES.RESERVED]: {
    color: '#FFB347',
    type: DEFAULT_CONTRACT_STATUS_TYPES.RESERVED,
    name: 'Reserved',
  },
  [DEFAULT_CONTRACT_STATUS_TYPES.DRAFT]: {
    color: '#4ECDC4',
    type: DEFAULT_CONTRACT_STATUS_TYPES.DRAFT,
    name: 'Draft',
  },
  [DEFAULT_CONTRACT_STATUS_TYPES.SIGNED]: {
    color: '#45B7D1',
    type: DEFAULT_CONTRACT_STATUS_TYPES.SIGNED,
    name: 'Signed',
  },
  [DEFAULT_CONTRACT_STATUS_TYPES.LOST]: {
    color: '#D9534F',
    type: DEFAULT_CONTRACT_STATUS_TYPES.LOST,
    name: 'Lost',
  },
  [DEFAULT_CONTRACT_STATUS_TYPES.CANCELLED]: {
    color: '#C0392B',
    type: DEFAULT_CONTRACT_STATUS_TYPES.CANCELLED,
    name: 'Cancelled',
  },
};
