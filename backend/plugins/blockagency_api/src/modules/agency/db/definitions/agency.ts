import { attachmentSchema } from 'erxes-api-shared/core-modules';
import { Schema } from 'mongoose';

import { BLOCKAGENCY_VERIFICATION_STATUS } from '~/constants';
import { IBlockAgencyDocument } from '~/modules/agency/@types/agency';

export const blockAgencySchema = new Schema<IBlockAgencyDocument>(
  {
    name: { type: String, label: 'Name' },
    brandName: { type: String, label: 'Brand Name' },
    type: { type: String, label: 'Type' },
    description: { type: String, label: 'Description' },
    brief: { type: String, label: 'Brief' },
    dateFounded: { type: String, label: 'Date Founded' },
    website: { type: String },
    emails: [{ type: String }],
    primaryEmail: { type: String },
    phones: [{ type: String }],
    primaryPhone: { type: String },
    logo: { type: attachmentSchema },
    coverImage: { type: attachmentSchema },
    documents: [{ type: attachmentSchema }],
    socialLinks: { type: Map, of: String, default: {} },
    operationArea: {
      city: { type: String, label: 'City' },
      district: { type: String, label: 'District' },
    },
    fieldsOfExpertise: {
      propertyTypes: [{ type: String, label: 'Property Types' }],
      services: [{ type: String, label: 'Services' }],
      clientTypes: [{ type: String, label: 'Client Types' }],
    },
    messengerIntegrationId: { type: String, label: 'Messenger Integration Id' },
    widgetBundleUrl: { type: String, label: 'Widget Bundle Url' },
    verificationStatus: {
      type: String,
      label: 'Verification Status',
      enum: BLOCKAGENCY_VERIFICATION_STATUS.ALL,
      default: BLOCKAGENCY_VERIFICATION_STATUS.PENDING,
    },
    rejectionReasons: [{ type: String }],
    rejectionNotes: { type: String },
  },
  {
    timestamps: true,
  },
);
