import { attachmentSchema } from 'erxes-api-shared/core-modules';
import { Schema } from 'mongoose';
import { IBlockAdminAgentDocument } from '@/member/@types/member';

const agentUserSchema = new Schema(
  {
    _id: { type: String, label: 'User ID' },
    firstName: { type: String, label: 'First name' },
    lastName: { type: String, label: 'Last name' },
    avatar: { type: String, label: 'Avatar' },
    email: { type: String, label: 'Email' },
  },
  { _id: false },
);

export const agentSchema = new Schema<IBlockAdminAgentDocument>(
  {
    subdomain: { type: String, required: true, index: true },
    entityId: { type: String, required: true, index: true },
    agencyId: { type: String, label: 'Agency ID', index: true },
    memberId: { type: String, label: 'Core user ID' },
    role: {
      type: String,
      enum: ['admin', 'lead', 'member'],
      default: 'member',
    },
    description: { type: String, label: 'Description' },
    country: { type: String, label: 'Country' },
    city: { type: String, label: 'City' },
    district: { type: String, label: 'District' },
    facebookUrl: { type: String, label: 'Facebook URL' },
    instagramUrl: { type: String, label: 'Instagram URL' },
    linkedUrl: { type: String, label: 'LinkedIn URL' },
    certificatePhotos: [{ type: attachmentSchema }],
    user: { type: agentUserSchema, default: null },
  },
  { timestamps: true },
);

agentSchema.index({ subdomain: 1, entityId: 1 }, { unique: true });
