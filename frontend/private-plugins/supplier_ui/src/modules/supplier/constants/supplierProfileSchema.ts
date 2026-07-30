import { z } from 'zod';

const domain = z
  .string()
  .regex(/^(https?:\/\/)?(?:[a-z0-9-]+\.)+[a-z]{2,}(\/[^\s]*)?$/i, {
    message: 'Invalid URL',
  });

const domainOrEmpty = z.union([domain, z.literal('')]);
const emailOrEmpty = z.union([z.string().email(), z.literal('')]);

export const supplierProfileSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  logo: z.string().optional(),
  coverImage: z.string().optional(),
  attachments: z.array(z.string()).optional(),
  urls: z.array(z.string()).optional(),
  about: z.string().optional(),
  website: domainOrEmpty.optional(),
  registrationNumber: z.string().optional(),
  address: z.object({
    details: z.object({
      countryCode: z.string().min(1).optional(),
      country: z.string().min(1).optional(),
      postCode: z.string().optional(),
      city: z.string().optional(),
      city_district: z.string().optional(),
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
  paymentId: z.string().optional(),
  primaryEmail: emailOrEmpty.optional(),
  primaryPhone: z.string().optional(),
  phones: z.array(z.string()).optional(),
  socialLinks: z.object({
    facebook: domainOrEmpty.optional(),
    twitter: domainOrEmpty.optional(),
    instagram: domainOrEmpty.optional(),
    linkedin: domainOrEmpty.optional(),
    youtube: domainOrEmpty.optional(),
  }),
});
