export const SUPPLIER_CODE = {
  // Code = <ZIP><N>, e.g. 130001 (1st), 1300022 (22nd). ZIP is the supplier's
  // Mongolian postal code (from city + district/soum); N is a per-location
  // atomic sequence with no zero padding.
  COUNTER_PREFIX: 'supplierCode',
};

export const SUPPLIER_VERIFICATION_STATUS = {
  VERIFIED: 'verified',
  UNVERIFIED: 'unverified',
  PENDING: 'pending',
  ALL: ['verified', 'unverified', 'pending'],
};

export const MEMBERSHIP_STATUS = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
  // PAUSED: 'paused',
  // SUSPENDED: 'suspended',
  ALL: [
    'active', 
    'expired', 
    'cancelled', 
    // 'paused', 
    // 'suspended'
  ],
};
