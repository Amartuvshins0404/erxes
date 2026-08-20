import { Document } from 'mongoose';
import { IBlock } from '~/types';

export interface IBlockAdminListingLocation {
  city: string;
  district: string;
  subDistrict: string;
  short?: string;
  geoPoint?: {
    type: 'Point';
    coordinates: [number, number];
  };
}

export interface IBlockAdminListingPricing {
  amount: number;
  currency?: string;
  priceType?: 'fixed' | 'negotiable' | 'onRequest';
}

export interface IBlockAdminListingSpecs {
  area: number;
  floor?: number;
  totalFloors?: number;
  rooms?: number;
  builtYear?: string;
}

export interface IBlockAdminListingAgent {
  _id?: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}

export interface IBlockAdminListing extends IBlock {
  title: string;
  /** Agency-side member id of the listing owner, i.e. `BlockAdminAgent.entityId`. */
  agencyMemberId?: string;
  type: 'sale' | 'rent' | 'lease';
  propertyType: string;
  status: 'active' | 'inactive' | 'sold' | 'draft';
  description: string;
  location: IBlockAdminListingLocation;
  pricing: IBlockAdminListingPricing;
  specs: IBlockAdminListingSpecs;
  mediaAttachments?: string[];
  featuredImg?: string;
  viewCount?: number;
  isFeatured?: boolean;
  agent?: IBlockAdminListingAgent | null;
}

export interface IBlockAdminListingDocument
  extends IBlockAdminListing, Document {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}
