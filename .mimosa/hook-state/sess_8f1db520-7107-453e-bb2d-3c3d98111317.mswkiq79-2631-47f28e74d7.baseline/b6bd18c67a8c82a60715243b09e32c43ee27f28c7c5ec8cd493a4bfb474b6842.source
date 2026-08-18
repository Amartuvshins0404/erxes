export interface IProjectLocation {
  address?: string;
  city?: string;
  district?: string;
  lat?: number;
  lng?: number;
  parcelId?: string;
}

export type ProjectStatus = 'planned' | 'on_going' | 'on_sale' | 'completed';

export interface IProject {
  _id: string;
  name: string;
  coverImage?: string;
  location?: IProjectLocation;

  isPublished: boolean;
  status: ProjectStatus;
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
}

export interface IProjectPrice {
  currency: string;
  price: number;
  priceType: 'priceBySize' | 'priceByUnit';
}

export interface IProjectGeneralInput {
  name: string | null;
  shortDescription: string | null;
  description: string | null;
  location: IProjectLocation | null;
  status: string | null;
  coverImage: string | null;
  logo: string | null;
  images: string[] | null;
  videos: string[] | null;
  mainPrice: number | null;
  prices: IProjectPrice[] | null;
  bankPartners: string[] | null;
  projectAmenities: { category: string; amenities: string[] }[];
  types: string[] | null;

  startDate?: Date;
  endDate?: Date;

  counts?: Record<string, number>;
  metrics?: Record<string, number>;
  targets?: Record<string, string>;
  contacts?: Record<string, any>;
  links?: Record<string, string>;
  schedules?: Record<
    string,
    { open: boolean; startOfDay: string; endOfDay: string }
  >;
}

export interface IProjectMember {
  _id: string;
  memberId: string;
  project: string;
  role: string;
}
