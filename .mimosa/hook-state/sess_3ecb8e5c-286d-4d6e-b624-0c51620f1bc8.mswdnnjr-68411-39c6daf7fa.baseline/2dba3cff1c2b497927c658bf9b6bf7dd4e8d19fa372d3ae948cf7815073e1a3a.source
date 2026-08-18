import { z } from 'zod';
import {
  listingSchema,
  locationSchema,
  pricingSchema,
  specsSchema,
} from '../form/listing';

export interface IListingAgent {
  _id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface IListingInline {
  _id: string;
  title: string;
  type: 'sale' | 'rent' | 'lease';
  propertyType: string;
  pricing?: IListingPricing;
  status: 'active' | 'inactive' | 'sold' | 'draft';
  viewCount?: number;
  memberId?: string;
  agent?: IListingAgent;
  createdAt?: string;
}

export type IListingLocation = z.infer<typeof locationSchema>;

export type IListingSpecs = z.infer<typeof specsSchema>;

export type IListingPricing = z.infer<typeof pricingSchema>;

export type IListing = z.infer<typeof listingSchema>;
