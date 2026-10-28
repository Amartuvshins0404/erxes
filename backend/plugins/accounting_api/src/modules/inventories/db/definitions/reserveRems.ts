import { mongooseStringRandomId, schemaWrapper } from 'erxes-api-shared/utils';
import { Schema } from 'mongoose';

export const reserveRemSchema = schemaWrapper(
  new Schema({
    _id: mongooseStringRandomId,
    placeEntityId: { type: String, label: 'Place' },
    productId: { type: String, label: 'product' },
    uom: { type: String, label: 'Uom' },
    remainder: { type: Number, label: 'Remainder' },
    createdAt: { type: Date, default: new Date(), label: 'Created at' },
    createdBy: { type: String, label: 'Created by' },
    modifiedAt: {
      type: Date,
      default: new Date(),
      label: 'Modified at',
    },
    modifiedBy: { type: String, label: 'Modified by' },
  }),
);
