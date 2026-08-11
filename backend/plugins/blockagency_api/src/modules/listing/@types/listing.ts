import { Document } from 'mongoose';

export interface IBlockListingLocation {
  city?: string;
  district?: string;
  subDistrict?: string;
  short?: string;
  lat?: number;
  lng?: number;
}

export interface IBlockListingPricing {
  amount?: number;
  currency?: string;
  priceType?: 'fixed' | 'negotiable' | 'onRequest';
}

export interface IBlockListingSpecs {
  area?: number;
  floor?: number;
  totalFloors?: number;
  rooms?: number;
  builtYear?: string;
}

export interface IBlockListingAgent {
  _id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
}

export interface IBlockListing {
  title: string;
  type?: 'sale' | 'rent' | 'lease';
  propertyType?: string;
  status?: 'active' | 'inactive' | 'sold' | 'draft';
  description?: string;
  location?: IBlockListingLocation;
  pricing?: IBlockListingPricing;
  specs?: IBlockListingSpecs;
  mediaAttachments?: string[];
  featuredImg?: string;
  viewCount?: number;
  isFeatured?: boolean;
  memberId?: string;
  agent?: IBlockListingAgent | null;
}

export interface IBlockListingDocument extends IBlockListing, Document<string> {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListingQueryParams {
  searchValue?: string;
  status?: string;
  city?: string;
  district?: string;
}
