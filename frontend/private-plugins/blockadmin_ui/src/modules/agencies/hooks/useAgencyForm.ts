import { z } from 'zod';
import {
  agencyBasicInformationSchema,
  agencyDocuments,
  agencyFieldsOfExpertiseSchema,
  agencyIdentitySchema,
  agencyIntroductionSchema,
  agencyOperationAreasSchema,
  agencySocialLinksSchema,
  agencyIntegrationsSchema,
} from '../schema';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

export const agencySchema = agencyIdentitySchema
  .merge(agencyBasicInformationSchema)
  .merge(agencyIntroductionSchema)
  .merge(agencyDocuments)
  .merge(agencyFieldsOfExpertiseSchema)
  .merge(agencyOperationAreasSchema)
  .merge(agencySocialLinksSchema)
  .merge(agencyIntegrationsSchema);

export type AgencyProfileSchema = z.infer<typeof agencySchema>;

export const useAgencyForm = (defaultValues?: AgencyProfileSchema) => {
  const form = useForm<AgencyProfileSchema>({
    resolver: zodResolver(agencySchema),
    defaultValues: {
      name: '',
      type: 'agency',
      brandName: '',
      dateFounded: '',
      brief: '',
      description: '',
      documents: [],
      website: '',
      emails: [],
      phones: [],
      primaryEmail: '',
      primaryPhone: '',
      fieldsOfExpertise: { propertyTypes: [], services: [], clientTypes: [] },
      operationArea: { city: '', district: '' },
      socialLinks: { facebook: '', instagram: '', linkedin: '' },
      messengerIntegrationId: '',
      widgetBundleUrl: '',
      ...defaultValues,
    },
  });
  return { form };
};
