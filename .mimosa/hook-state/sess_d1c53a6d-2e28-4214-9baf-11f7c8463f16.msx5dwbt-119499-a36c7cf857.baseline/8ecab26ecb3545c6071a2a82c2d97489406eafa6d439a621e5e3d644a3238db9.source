export enum GenderRestriction {
  MALE = 'male',
  FEMALE = 'female',
  MIXED = 'mixed',
}

export interface MultilingualString {
  en: string;
  mn: string;
}

export interface MultilingualStringOptional {
  en?: string;
  mn?: string;
}

export interface OneFitActivityType {
  _id: string;
  createdAt: string;
  modifiedAt: string;
  providerId: string;
  provider?: {
    _id: string;
    businessName: string;
  };
  name: MultilingualString;
  description?: MultilingualStringOptional;
  creditCost: number;
  price?: number;
  duration: number;
  genderRestriction: GenderRestriction;
  categoryIds: string[];
  categories?: Array<{
    _id: string;
    name: {
      en: string;
      mn: string;
    };
  }>;
  isActive: boolean;
  cancellationDeadline?: number;
  singlePersonLimit?: number;
  image?: string;
}

export interface OneFitActivityTypeListResponse {
  list: OneFitActivityType[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor?: string;
    endCursor?: string;
  };
  totalCount: number;
}

export interface ActivityTypeFilters {
  searchValue?: string;
  providerId?: string;
  categoryId?: string;
  genderRestriction?: GenderRestriction;
  isActive?: boolean;
}
