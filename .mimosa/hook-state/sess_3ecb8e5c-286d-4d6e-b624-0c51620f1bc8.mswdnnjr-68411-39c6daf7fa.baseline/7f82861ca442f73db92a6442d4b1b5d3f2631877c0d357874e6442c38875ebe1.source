export enum ProviderStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export interface MultilingualString {
  en: string;
  mn: string;
}

export interface MultilingualStringOptional {
  en?: string;
  mn?: string;
}

export interface OneFitLocation {
  address: MultilingualString;
  city: MultilingualString;
  district?: MultilingualStringOptional;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface OneFitContactInfo {
  phone: string;
  email: string;
  website?: string;
}

export interface OneFitActivityCategory {
  _id: string;
  name: MultilingualString;
}

export interface OneFitProviderReviewSummary {
  averageRating: number;
  reviewCount: number;
}

export interface OneFitProviderReviewUser {
  _id: string;
  firstName?: string;
  lastName?: string;
  primaryEmail?: string;
}

export interface OneFitProviderReview {
  _id: string;
  providerId: string;
  userId: string;
  bookingId?: string;
  activityTypeId?: string;
  rating: number;
  comment?: string;
  createdAt?: string;
  modifiedAt?: string;
  user?: OneFitProviderReviewUser | null;
}

export interface OneFitProviderReviewListResponse {
  list: OneFitProviderReview[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor?: string;
    endCursor?: string;
  };
  totalCount: number;
}

export interface OneFitProvider {
  _id: string;
  createdAt: string;
  modifiedAt: string;
  instanceId?: string;
  businessName: MultilingualString;
  description?: MultilingualStringOptional;
  location: OneFitLocation;
  contactInfo: OneFitContactInfo;
  facilities?: string[];
  categoryIds: string[];
  categories?: OneFitActivityCategory[];
  singleProviderLimit?: number;
  status: string;
  rejectionReason?: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectedBy?: string;
  isActive: boolean;
  icon?: string;
  coverImages?: string[];
  reviewSummary?: OneFitProviderReviewSummary;
}

export interface OneFitProviderListResponse {
  list: OneFitProvider[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor?: string;
    endCursor?: string;
  };
  totalCount: number;
}

export interface ProviderFilters {
  searchValue?: string;
  status?: string;
  categoryId?: string;
  isActive?: boolean;
}

export interface OneFitCity {
  _id: string;
  name: MultilingualString;
  code?: string;
  isActive?: boolean;
  createdAt?: string;
  modifiedAt?: string;
}

export interface OneFitDistrict {
  _id: string;
  cityId: string;
  name: MultilingualString;
  code?: string;
  isActive?: boolean;
  createdAt?: string;
  modifiedAt?: string;
}
