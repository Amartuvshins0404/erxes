import { Schema } from 'mongoose';
import { mongooseStringRandomId } from 'erxes-api-shared/utils';
import { SUPPLIER_VERIFICATION_STATUS } from '~/constants';
import { schemaWrapper } from '~/utils';
import {
  IMushopSupplierDocument,
  ISupplierSocialLink,
} from '@/supplier/@types/supplier';

const supplierSocialLinkSchema = new Schema<ISupplierSocialLink>(
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

export const supplierSchema = schemaWrapper(
  new Schema<IMushopSupplierDocument>(
    {
      _id: mongooseStringRandomId,
      code: {
        type: String,
        label: 'Supplier code',
        unique: true,
        sparse: true,
        immutable: true,
      },
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

      socialLinks: { type: supplierSocialLinkSchema },

      ownerUserId: { type: String, index: true },
      posToken: { type: String, label: 'POS token' },
      mushopPosToken: { type: String, label: 'Mushop POS token' },
    },
    {
      timestamps: true,
    },
  ),
);
