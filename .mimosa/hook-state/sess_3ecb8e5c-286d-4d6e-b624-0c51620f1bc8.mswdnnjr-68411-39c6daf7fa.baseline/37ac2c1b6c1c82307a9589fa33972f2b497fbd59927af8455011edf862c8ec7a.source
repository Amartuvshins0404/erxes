export interface INews {
  _id: string;
  content: string;
  title: string;
  name: string;
  coverImage?: string;
  video?: string;
  logo?: string;
  images?: string[];
  location?: INewsLocation;
  verificationStatus?: string;
}

export interface INewsLocation {
  address?: string;
  city?: string;
  district?: string;
  lat?: number;
  lng?: number;
  parcelId?: string;
}

export interface INewsDetail extends INews {
  isPublished: boolean;
  verificationStatus: 'pending' | 'need_info' | 'approved' | 'rejected' | 'violation';
  status: string;
  description: string;
  logo: string;
  images: string[];
  title: string;
  companyId: string;
  content: string;
  type: string[];
  newsAmenities: { category: string; amenities: string[] }[];
}

export interface INewsGeneralInput {
  name: string | null;
  companyId: string | null;
  location: INewsLocation | null;
  title: string | null;
  content: string | null;
  description: string | null;
  status: string | null;
  coverImage: string | null;
  video: string | null;
  logo: string | null;
  images: string[] | null;
  newsAmenities: { category: string; amenities: string[] }[];
}

export interface ICompany {
  _id: string;
  name: string;
  logo: string;
  coverImage: string;
  description: string;
  website: string;
  address: INewsLocation;
  phones: string[];
  socialLinks: {
    facebook: string;
    instagram: string;
    twitter: string;
    linkedin: string;
    youtube: string;
    website: string;
  };
  verificationStatus: string;
}

export interface INewsMember {
  _id: string;
  memberId: string;
  news: string;
  role: string;
}
