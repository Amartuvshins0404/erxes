import { Schema } from 'mongoose';
import { BLOCK_VERIFICATION_STATUS } from '~/constants';
import { schemaWrapper } from '~/utils';
import { IBlockAgencyDocument } from '@/agency/@types/agency';

export const agencySchema = schemaWrapper(
  new Schema<IBlockAgencyDocument>(
    {
      name: { type: String },
      brandName: { type: String },
      type: { type: String },
      description: { type: String },
      brief: { type: String },
      website: { type: String },
      emails: [{ type: String }],
      primaryEmail: { type: String },
      phones: [{ type: String }],
      primaryPhone: { type: String },
      dateFounded: { type: String },
      logo: { type: String },
      coverImage: { type: String },
      documents: [{ type: String }],
      socialLinks: { type: Map, of: String, default: {} },
      operationArea: {
        city: { type: String },
        district: { type: String },
      },
      fieldsOfExpertise: {
        propertyTypes: [{ type: String }],
        services: [{ type: String }],
        clientTypes: [{ type: String }],
      },
      messengerIntegrationId: { type: String },
      widgetBundleUrl: { type: String },
      verificationStatus: {
        type: String,
        label: 'Verification Status',
        enum: BLOCK_VERIFICATION_STATUS.ALL,
        default: BLOCK_VERIFICATION_STATUS.PENDING,
      },
      rejectionReasons: [{ type: String }],
      rejectionNotes: { type: String },
    },
    { timestamps: true },
  ),
);
