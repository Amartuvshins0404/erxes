export interface INews {
  _id: string;
  content: string;
  title: string;
  name: string;
  companyId?: string;
  coverImage?: string;
  video?: string;
  logo?: string;
  images?: string[];
  location?: INewsLocation;
  verificationStatus?: string;
}

export interface ICompany {
  _id: string;
  name: string;
  logo: string;
}

export interface INewsLocation {
  address?: string;
  city?: string;
  district?: string;
  lat?: number;
  lng?: number;
  parcelId?: string;
}

export interface INewsPrice {
  currency: string;
  price: number;
  priceType: 'priceBySize' | 'priceByUnit';
}

export interface INewsDetail extends INews {
  isPublished: boolean;
  verificationStatus: 'pending' | 'need_info' | 'approved' | 'rejected' | 'violation';
  status: string;
  description: string;
  logo: string;
  images: string[];
  title: string;
  content: string;
  type: string[];
  mainPrice: number;
  prices: INewsPrice[];
  bankPartners: string[];
  newsAmenities: { category: string; amenities: string[] }[];
}

export interface INewsGeneralInput {
  name: string | null;
  location: INewsLocation | null;
  title: string | null;
  content: string | null;
  description: string | null;
  status: string | null;
  coverImage: string | null;
  video: string | null;
  logo: string | null;
  images: string[] | null;
  mainPrice: number | null;
  prices: INewsPrice[] | null;
  bankPartners: string[] | null;
  newsAmenities: { category: string; amenities: string[] }[];
}

export interface INewsMember {
  _id: string;
  memberId: string;
  news: string;
  role: string;
}
