export enum BookingStatus {
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  NO_SHOW = 'no_show',
}

export enum AttendanceStatus {
  PENDING = 'pending',
  ATTENDED = 'attended',
  NO_SHOW = 'no_show',
}

export interface OneFitBooking {
  _id: string;
  createdAt: string;
  modifiedAt: string;
  userId: string;
  providerId: string;
  activityTypeId: string;
  user?: {
    _id: string;
    firstName?: string;
    lastName?: string;
    primaryEmail?: string;
    primaryPhone?: string;
    sex?: number | null;
    birthDate?: string | null;
    oneFitMembershipPlanId?: string | null;
  };
  provider?: {
    _id: string;
    businessName: {
      en: string;
      mn: string;
    };
    coverImages?: string[];
  };
  activityType?: {
    _id: string;
    name: {
      en: string;
      mn: string;
    };
    image?: string;
  };
  bookingDate: string;
  startTime: string;
  endTime: string;
  creditCost: number;
  price?: number;
  status: BookingStatus;
  attendanceStatus: AttendanceStatus;
  bookingId: string;
  cancelledAt?: string;
  cancelledBy?: string;
  cancellationReason?: string;
  attendedAt?: string;
  markedBy?: string;
}

export interface OneFitBookingListResponse {
  list: OneFitBooking[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor?: string;
    endCursor?: string;
  };
  totalCount: number;
}

export interface BookingFilters {
  userId?: string;
  providerId?: string;
  activityTypeId?: string;
  bookingDate?: Date;
  startDate?: Date;
  endDate?: Date;
  status?: BookingStatus;
  attendanceStatus?: AttendanceStatus;
  bookingId?: string;
}

/** User is the raw OneFitCustomer document from the API (JSON). */
export interface CreditConsumptionRowUser {
  _id: string;
  firstName?: string;
  lastName?: string;
  primaryEmail?: string;
  primaryPhone?: string;
  currentCreditBalance?: number;
  [key: string]: unknown;
}

export interface CreditConsumptionRow {
  year: number;
  month: number;
  userId: string;
  user?: CreditConsumptionRowUser | null;
  totalCreditsConsumed: number;
  bookingCount: number;
}

export interface OneFitCreditConsumptionResponse {
  rows: CreditConsumptionRow[];
  totalCreditsConsumed: number;
  totalBookings: number;
}
