import { z } from 'zod';

const domain = z
  .string()
  .regex(/^(https?:\/\/)?(?:[a-z0-9-]+\.)+[a-z]{2,}(\/[^\s]*)?$/i);

export const developerInfoSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  logo: z.string().optional(),
  coverImage: z.string().optional(),
  about: z.string().optional(),
  website: domain,
  registrationNumber: z.string().optional(),
  address: z.object({
    address: z.object({
      countryCode: z.string().min(1).optional(),
      country: z.string().min(1).optional(),
      postCode: z.string().optional(),
      city: z.string().min(1),
      city_district: z.string().min(1),
      suburb: z.string().optional(),
      road: z.string().optional(),
      street: z.string().optional(),
      building: z.string().optional(),
      number: z.string().optional(),
      other: z.string().optional(),
    }),
    location: z
      .object({
        type: z.string().min(1).optional(),
        coordinates: z.array(z.number()).min(1).optional(),
      })
      .optional(),
    short: z.string().optional(),
  }),
  dateFounded: z.string().optional(),
  primaryEmail: z.string().email(),
  primaryPhone: z.string().optional(),
  phones: z.array(z.string()).optional(),
  socialLinks: z.object({
    facebook: domain.or(z.literal('')).optional(),
    twitter: domain.or(z.literal('')).optional(),
    instagram: domain.or(z.literal('')).optional(),
    linkedin: domain.or(z.literal('')).optional(),
    youtube: domain.or(z.literal('')).optional(),
  }),
});
