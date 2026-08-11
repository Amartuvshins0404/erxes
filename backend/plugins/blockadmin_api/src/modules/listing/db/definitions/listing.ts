import { Schema } from 'mongoose';
import { schemaWrapper } from '~/utils';
import { IBlockAdminListingDocument } from '../../@types/listing';

export const listingSchema = schemaWrapper(
  new Schema<IBlockAdminListingDocument>(
    {
      title: { type: String },
      type: { type: String, enum: ['sale', 'rent', 'lease'], default: 'sale' },
      propertyType: { type: String },
      status: {
        type: String,
        enum: ['active', 'inactive', 'sold', 'draft'],
        default: 'draft',
      },
      description: { type: String },
      location: {
        city: { type: String },
        district: { type: String },
        subDistrict: { type: String },
        short: { type: String },
        geoPoint: {
          type: { type: String, enum: ['Point'], default: 'Point' },
          coordinates: { type: [Number], index: '2dsphere' },
        },
      },
      pricing: {
        amount: { type: Number },
        currency: { type: String },
        priceType: {
          type: String,
          enum: ['fixed', 'negotiable', 'onRequest'],
          default: 'fixed',
        },
      },
      specs: {
        area: { type: Number },
        floor: { type: Number },
        totalFloors: { type: Number },
        rooms: { type: Number },
        builtYear: { type: String },
      },
      mediaAttachments: [{ type: String }],
      featuredImg: { type: String },
      viewCount: { type: Number, default: 0 },
      isFeatured: { type: Boolean, default: false },
      agent: {
        _id: { type: String },
        firstName: { type: String },
        lastName: { type: String },
        email: { type: String },
      },
    },
    { timestamps: true },
  ),
);
