export enum DayOfWeek {
  MONDAY = 'monday',
  TUESDAY = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY = 'thursday',
  FRIDAY = 'friday',
  SATURDAY = 'saturday',
  SUNDAY = 'sunday',
}

export interface OneFitDailySchedule {
  dayOfWeek: DayOfWeek;
  activityTypeId: string;
  genderRestriction: string;
  startTime: string;
  endTime: string;
  dailyLimit: number;
}

/** Form row shape: multiple weekdays per row, expanded to OneFitDailySchedule[] on submit */
export interface OneFitDailyScheduleRow {
  daysOfWeek: DayOfWeek[];
  activityTypeId: string;
  genderRestriction: string;
  startTime: string;
  endTime: string;
  dailyLimit: number;
}

export interface OneFitScheduleTemplate {
  _id: string;
  createdAt: string;
  modifiedAt?: string;
  providerId: string;
  month: number;
  year: number;
  dailySchedules: OneFitDailySchedule[];
}

export interface OneFitScheduleTemplateListResponse {
  list: OneFitScheduleTemplate[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor?: string;
    endCursor?: string;
  };
  totalCount: number;
}

export interface OneFitScheduleException {
  _id: string;
  createdAt: string;
  providerId: string;
  provider?: {
    _id: string;
    businessName: {
      en: string;
      mn: string;
    };
  };
  date: string;
  reason?: string;
  activityTypeId?: string;
}

export interface OneFitScheduleExceptionListResponse {
  list: OneFitScheduleException[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor?: string;
    endCursor?: string;
  };
  totalCount: number;
}

export interface ScheduleTemplateFilters {
  providerId?: string;
  year?: number;
  month?: number;
}

export interface ScheduleExceptionFilters {
  providerId: string;
  startDate?: string;
  endDate?: string;
}
