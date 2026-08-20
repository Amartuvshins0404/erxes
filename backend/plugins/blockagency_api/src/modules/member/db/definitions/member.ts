import { attachmentSchema } from 'erxes-api-shared/core-modules';
import { Schema } from 'mongoose';
import { IBlockAgencyMemberDocument } from '~/modules/member/@types/member';

export const blockAgencyMemberSchema = new Schema<IBlockAgencyMemberDocument>(
  {
    agencyId: { type: String, label: 'Agency ID' },
    memberId: { type: String, label: 'Member ID' },
    description: { type: String, label: 'Description' },
    country: { type: String, label: 'Country' },
    city: { type: String, label: 'City' },
    district: { type: String, label: 'District' },
    facebookUrl: { type: String, label: 'Facebook URL' },
    instagramUrl: { type: String, label: 'Instagram URL' },
    linkedUrl: { type: String, label: 'LinkedIn URL' },
    certificatePhotos: [{ type: attachmentSchema }],
    role: {
      type: String,
      enum: ['admin', 'lead', 'member'],
      default: 'member',
    },
  },
  {
    timestamps: true,
  },
);
