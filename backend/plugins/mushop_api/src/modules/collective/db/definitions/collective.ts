import { Schema } from 'mongoose';
import { mongooseStringRandomId } from 'erxes-api-shared/utils';
import {
  COLLECTIVE_STATUS,
  ICollectiveDocument,
  ICollectiveSocialLink,
  ICollectiveSupplierSyncResult,
} from '@/collective/@types/collective';

const collectiveSyncResultSchema = new Schema<ICollectiveSupplierSyncResult>(
  {
    supplierId: { type: String, required: true },
    subdomain: { type: String },
    total: { type: Number, default: 0 },
    created: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    errors: { type: [String], default: [] },
  },
  { _id: false },
);

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

export const collectiveSchema = new Schema<ICollectiveDocument>(
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

    socialLinks: { type: collectiveSocialLinkSchema },

    ownerUserId: { type: String, index: true },

    targetSubdomain: {
      type: String,
      required: true,
      unique: true,
      label: 'Target SaaS subdomain',
    },
    targetPosToken: { type: String, label: 'Target POS token' },
    supplierIds: { type: [String], default: [], index: true },
    status: {
      type: String,
      enum: COLLECTIVE_STATUS.ALL,
      default: COLLECTIVE_STATUS.PENDING,
      index: true,
    },
    syncResults: { type: [collectiveSyncResultSchema], default: [] },
    totalCreated: { type: Number, default: 0 },
    totalFailed: { type: Number, default: 0 },
    lastSyncedAt: { type: Date },
  },
  { timestamps: true },
);
