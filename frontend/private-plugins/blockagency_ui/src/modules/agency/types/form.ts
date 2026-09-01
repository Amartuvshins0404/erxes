import { z } from 'zod';
import {
  // Agency
  agencyAttachmentSchema,
  agencyIdentitySchema,
  agencyIntroductionSchema,
  agencyDocuments,
  agencyFieldsOfExpertiseSchema,
  agencyOperationAreasSchema,
  agencySocialLinksSchema,
  agencyGeneralInfoSchema,
  agencyContactInfoSchema,
  agencyIntegrationsSchema,
} from '../schema/form';
import { socialPlatforms } from '../constants/social-platforms';

// ─── Agency profile ───────────────────────────────────────────────────────────

export type SocialPlatform = (typeof socialPlatforms)[number];

export type AgencyAttachment = z.infer<typeof agencyAttachmentSchema>;

export type AgencyGeneralInfoValues = z.infer<typeof agencyGeneralInfoSchema>;
export type AgencyIdentityValues = z.infer<typeof agencyIdentitySchema>;
export type AgencyContactInfoValues = z.infer<typeof agencyContactInfoSchema>;

export type AgencyIntroductionValues = z.infer<typeof agencyIntroductionSchema>;

export type AgencyDocumentsValues = z.infer<typeof agencyDocuments>;

export type AgencyFieldsOfExpertiseValues = z.infer<
  typeof agencyFieldsOfExpertiseSchema
>;

export type AgencyOperationAreasValues = z.infer<
  typeof agencyOperationAreasSchema
>;

export type AgencySocialLinksValues = z.infer<typeof agencySocialLinksSchema>;

export type AgencyIntegrationsValues = z.infer<typeof agencyIntegrationsSchema>;
