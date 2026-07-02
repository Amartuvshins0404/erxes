import { Schema } from 'mongoose';
import { mongooseStringRandomId, schemaWrapper } from 'erxes-api-shared/utils';
import { SUPPLIER_VERIFICATION_STATUS } from '~/constants';
import {
  ICollectiveDocument,
  ICollectiveSocialLink,
} from '@/collective/@types/collective';

const collectiveSocialLinkSchema = new Schema<ICollectiveSocialLink>(
  {
    facebook: { type: String },
    twitter: { type: String },
    instagram: { type: String },
    linkedin: { type: String },
    youtube: { type: String },
    website: { type: String },
  },
  { _id: false },
);

export const collectiveSchema = schemaWrapper(
  new Schema<ICollectiveDocument>(
    {
      _id: mongooseStringRandomId,
      name: { type: String, label: 'Name' },
      description: { type: String, label: 'Description' },
      about: { type: String, label: 'About' },

      logo: { type: String, label: 'Logo' },
      coverImage: { type: String, label: 'Cover image' },
      attachments: { type: [String], default: [] },
      urls: { type: [String], default: [] },

      registrationNumber: { type: String, label: 'Registration number' },

      address: { type: Object },

      primaryEmail: { type: String, label: 'Primary email' },
      primaryPhone: { type: String, label: 'Primary phone' },

      phones: { type: [String], default: [] },
      emails: { type: [String], default: [] },

      dateFounded: { type: String },
      website: { type: String },

      paymentId: { type: String, label: 'Payment method' },

      verificationStatus: {
        type: String,
        label: 'Verification status',
        enum: SUPPLIER_VERIFICATION_STATUS.ALL,
        default: SUPPLIER_VERIFICATION_STATUS.PENDING,
      },
      tierLevel: { type: Number, default: 0 },
      verificationNote: { type: String },

      socialLinks: { type: collectiveSocialLinkSchema },

      ownerUserId: { type: String, index: true },
    },
    {
      timestamps: true,
    },
  ),
);
