export interface OneFitDayAvailability {
  date: string;
  hasSchedule: boolean;
  isBlockedByException: boolean;
  isFull: boolean;
  seatsLeft: number;
  totalSeats: number;
  bookedSeats: number;
  schedule?: {
    dayOfWeek: string;
    activityTypeId: string;
    startTime: string;
    endTime: string;
    dailyLimit: number;
  };
}

export interface OneFitMonthAvailabilityResponse {
  oneFitMonthAvailability: {
    year: number;
    month: number;
    days: OneFitDayAvailability[];
  };
}
