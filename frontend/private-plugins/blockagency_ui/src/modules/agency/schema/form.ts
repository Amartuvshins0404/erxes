import { z } from 'zod';
import { socialPlatforms } from '../constants/social-platforms';
import { getBlockPlainText } from '../utils/blockText';

export const BRIEF_MAX_LENGTH = 300;

// Uploaded file, matches the `Attachment` graphql type. Only `url` and `name`
// are guaranteed, the rest is missing on files uploaded before the migration
// from plain url strings.
export const agencyAttachmentSchema = z.object({
  url: z.string(),
  name: z.string(),
  type: z.string().nullish(),
  size: z.number().nullish(),
  duration: z.number().nullish(),
});

// Agency profile
export const agencyIdentitySchema = z.object({
  logo: agencyAttachmentSchema.nullish(),
  coverImage: agencyAttachmentSchema.nullish(),
});

export const agencyGeneralInfoSchema = z.object({
  name: z.string(),
  brandName: z.string(),
  dateFounded: z.string().optional(),
  website: z.string().optional(),
});

export const agencyIntegrationsSchema = z.object({
  messengerIntegrationId: z.string().optional(),
  widgetBundleUrl: z.string().optional(),
});

export const agencyContactInfoSchema = z.object({
  primaryEmail: z.string().optional(),
  emails: z.string().array().optional(),
  phones: z.string().array().optional(),
  primaryPhone: z.string().optional(),
});

export const agencyIntroductionSchema = z.object({
  // `brief` holds serialized editor blocks, so the limit is measured on the
  // text the agency actually wrote, not on the serialized payload.
  brief: z
    .string()
    .refine(
      (value) => getBlockPlainText(value).length <= BRIEF_MAX_LENGTH,
      `Brief must be at most ${BRIEF_MAX_LENGTH} characters`,
    ),
  description: z.string(),
});

export const agencyDocuments = z.object({
  documents: z.array(agencyAttachmentSchema).optional(),
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
