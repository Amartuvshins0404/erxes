export interface MetricField {
  value: number;
  previousValue: number | null;
  changePercent: number | null;
}

export interface CategoryDistributionItem {
  categoryId: string;
  label: string;
  parentId?: string;
  depth: number;
  count: number;
  percent: number;
}

export interface PackageStatItem {
  planId: string;
  planName: string;
  activeCustomerCount: number;
  currentCreditTotal: number;
  totalCredit: number;
  consumedCredit: number;
  checkInCount: {
    attended: number;
    noShow: number;
    cancelled: number;
  };
  usagePercent: number;
}

export interface CompanyUserStatItem {
  companyId: string;
  companyName: string;
  userId: string;
  userName: string;
  userPhone: string;
  planId: string;
  planName: string;
  lastPurchaseDate: string | null;
  planCredit: number;
  creditBeforeLastPurchase: number;
  lastExpirationCredit: number;
  currentCredit: number;
  usedCredit: number;
}

export interface B2bB2cSalesStats {
  b2bCount: number;
  b2cCount: number;
  b2bPercent: number;
  b2cPercent: number;
}

export interface UserGrowthMonthRow {
  monthKey: string;
  b2bUsers: number;
  b2cUsers: number;
  newUsers: number;
}

export interface BookingStatusDayRow {
  dayKey: string;
  bookings: number;
  completed: number;
  noShow: number;
}

export type DashboardPreset = '1w' | '2w' | '1m' | '2m' | '1y';
