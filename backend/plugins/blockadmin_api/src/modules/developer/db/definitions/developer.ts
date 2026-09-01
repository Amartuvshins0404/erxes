import {
  IBlockDeveloperDocument,
  IBlockDeveloperSocialLink,
} from '@/developer/db/@types/developer';
import { Schema } from 'mongoose';
import { BLOCK_VERIFICATION_STATUS } from '~/constants';
import { schemaWrapper } from '~/utils';

const blockDeveloperSocialLinkSchema = new Schema<IBlockDeveloperSocialLink>(
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

export const developerSchema = schemaWrapper(
  new Schema<IBlockDeveloperDocument>({
    name: { type: String },

    about: { type: String },
    description: { type: String },

    logo: { type: String },
    coverImage: { type: String },

    registrationNumber: { type: String },

    address: { type: Object },

    primaryPhone: { type: String },
    primaryEmail: { type: String },

    phones: { type: [String] },
    emails: { type: [String] },

    dateFounded: { type: String },
    website: { type: String },
    verificationStatus: {
      type: String,
      label: 'Verification Status',
      enum: BLOCK_VERIFICATION_STATUS.ALL,
      default: BLOCK_VERIFICATION_STATUS.PENDING,
    },

    socialLinks: { type: blockDeveloperSocialLinkSchema },

    tierLevel: { type: Number, default: 0 },
    visibility: { type: String, default: 'public', enum: ['public', 'private'] },
  }, {
    timestamps: true,
  }),
);
