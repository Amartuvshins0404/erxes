import { z } from 'zod';
import { socialPlatforms } from './constants/social-platforms';

// Agency profile
export const agencyIdentitySchema = z.object({
  logo: z.string().optional(),
  coverImage: z.string().optional(),
});

export const agencyBasicInformationSchema = z.object({
  name: z.string(),
  type: z.string(),
  brandName: z.string(),
  dateFounded: z.string().optional(),
  primaryEmail: z.string().optional(),
  emails: z.string().array().optional(),
  phones: z.string().array().optional(),
  primaryPhone: z.string().optional(),
  website: z.string().optional(),
});

export const agencyIntroductionSchema = z.object({
  brief: z.string().max(300, 'Brief must be at most 300 characters'),
  description: z.string(),
});

export const agencyDocuments = z.object({
  documents: z.array(z.string()).optional(),
});

export const agencyFieldsOfExpertiseItemSchema = z.object({
  // Үл хөдлөхийн төрөл (Real Estate Types)
  propertyTypes: z.array(
    z.enum([
      'RESIDENTIAL', // Орон сууц
      'HOUSE', // Байшин
      'LAND', // Газар
      'COMMERCIAL', // Арилжааны талбай
      'OFFICE', // Оффис
    ]),
  ),

  // Үзүүлдэг үйлчилгээ (Services Provided)
  services: z.array(
    z.enum([
      'SALES', // Худалдах
      'RENTAL', // Түрээслэх
      'BROKERAGE', // Зуучлал
      'VALUATION', // Үнэлгээ
      'INVESTMENT_ADVISORY', // Хөрөнгө оруулалтын зөвлөгөө
      'PROPERTY_MANAGEMENT', // Үл хөдлөх хөрөнгийн менежмент
    ]),
  ),

  // Харилцагчийн төрөл (Client Types) — matches backend field name
  clientTypes: z.array(
    z.enum([
      'INDIVIDUAL_BUYER', // Хувь хүн худалдан авагч
      'INVESTOR', // Хөрөнгө оруулагч
      'CORPORATE_CLIENT', // Корпорэйт үйлчлүүлэгч
      'DEVELOPER', // Хөгжүүлэгч компани
    ]),
  ),
});

export const agencyFieldsOfExpertiseSchema = z.object({
  fieldsOfExpertise: agencyFieldsOfExpertiseItemSchema,
});

export const agencyOperationAreasSchema = z.object({
  operationArea: z.object({
    city: z.string(),
    district: z.string(),
  }),
});

export const agencySocialLinksSchema = z.object({
  socialLinks: z
    .record(z.enum(socialPlatforms), z.string().url().optional())
    .optional(),
});

export const agencyIntegrationsSchema = z.object({
  messengerIntegrationId: z.string().optional(),
  widgetBundleUrl: z.string().optional(),
});
