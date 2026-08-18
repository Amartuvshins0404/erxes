export interface IProjectLocation {
  address?: string;
  city?: string;
  district?: string;
  lat?: number;
  lng?: number;
  parcelId?: string;
}

export interface IProject {
  _id: string;
  name: string;
  coverImage?: string;
  location?: IProjectLocation;

  isPublished: boolean;
  status: 'planned' | 'on_going' | 'on_sale' | 'completed';
  verificationStatus: 'verified' | 'unverified' | 'pending';
  shortDescription: string;
  description: string;
  logo: string;
  images: string[];
  type: string[];
  mainPrice: number;
  prices: IProjectPrice[];
  bankPartners: string[];
  projectAmenities: { category: string; amenities: string[] }[];
  types: string[];

  startDate: Date;
  endDate: Date;

  developerId?: string;

  counts?: Record<string, number>;
  priceRanges?: Record<string, { min: number; max: number }>;
  progress?: number;
  metrics?: Record<string, number>;
  targets?: Record<string, string>;
  contacts?: Record<string, any>;
  links?: Record<string, string>;
  schedules?: Record<
    string,
    { open: boolean; startOfDay: string; endOfDay: string }
  >;
  isFeatured?: boolean
}

export interface IProjectPrice {
  currency: string;
  price: number;
  priceType: 'priceBySize' | 'priceByUnit';
}

export interface IProjectGeneralInput {
  isPublished?: boolean;
  isFeatured?: boolean;
}

export interface IProjectMember {
  _id: string;
  memberId: string;
  project: string;
  role: string;
}
