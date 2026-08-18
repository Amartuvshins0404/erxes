import { z } from 'zod';

export const companyInfoSchema = z.object({
  _id: z.string().optional(),
  name: z.string(),
  description: z.string().optional(),
  logo: z.string().optional(),
  coverImage: z.string().optional(),
  about: z.string().optional(),
  website: z.string().url().optional(),
  address: z.object({
    city: z.string().min(1),
    district: z.string().min(1),
    address: z.string().optional(),
  }),
  dateFounded: z.string().optional(),
  email: z.string().email(),
  primaryPhone: z.string().optional(),
  phones: z.array(z.string()).optional(),
  socialLinks: z.object({
    facebook: z.string().url().or(z.literal('')).optional(),
    twitter: z.string().url().or(z.literal('')).optional(),
    instagram: z.string().url().or(z.literal('')).optional(),
    linkedin: z.string().url().or(z.literal('')).optional(),
    youtube: z.string().url().or(z.literal('')).optional(),
  }),
});
