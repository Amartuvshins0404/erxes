import { CurrencyCode } from 'erxes-ui';
import { z } from 'zod';
import {
  LISTING_TYPES,
  PRICING_TYPE,
  STATUS_TYPES,
} from '../constants/listing';

export const locationSchema = z.object({
  city: z.string().nullish(),
  district: z.string().nullish(),
  subDistrict: z.string().nullish(),
  short: z
    .string()
    .max(300, 'Cannot exceed maximum 300 characters')
    .nullish(),
  lat: z.number().nullish(),
  lng: z.number().nullish(),
});

export const specsSchema = z.object({
  area: z.number().nullish(),
  floor: z.number().nullish(),
  totalFloors: z.number().nullish(),
  rooms: z.number().nullish(),
  builtYear: z.string().nullish(),
});

export const pricingSchema = z.object({
  amount: z.number().nullish(),
  currency: z
    .nativeEnum(CurrencyCode)
    .default('MNT' as CurrencyCode)
    .nullish(),
  priceType: z.enum(PRICING_TYPE).nullish(),
});

export const listingSchema = z.object({
  title: z.string(),
  type: z.enum(LISTING_TYPES).nullish(),
  propertyType: z.string().nullish(),
  status: z.enum(STATUS_TYPES).nullish(),
  description: z.string().nullish(),
  location: locationSchema.nullish(),
  pricing: pricingSchema.nullish(),
  specs: specsSchema.nullish(),
  mediaAttachments: z.string().array().nullish(),
  featuredImg: z.string().nullish(),
  memberId: z.string().nullish(),
});
