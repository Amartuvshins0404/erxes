import { mongooseStringRandomId } from 'erxes-api-shared/utils';
import { Schema } from 'mongoose';
import { EventStatus } from '@/event/constants';
import {
  IEventAgendaDocument,
  IEventDocument,
  ISavedEventDocument,
} from '@/event/@types/event';

const locationSchema = new Schema(
  {
    city: { type: String, label: 'City' },
    district: { type: String, label: 'District' },
    address: { type: String, label: 'Address' },
    lat: { type: Number, label: 'Latitude' },
    lng: { type: Number, label: 'Longitude' },
  },
  { _id: false },
);

export const eventSchema = new Schema<IEventDocument>(
  {
    _id: mongooseStringRandomId,
    name: { type: String, required: true, label: 'Name' },
    description: { type: String, label: 'Description' },
    coverImage: { type: String, label: 'Cover image' },
    images: { type: [String], default: [], label: 'Images' },
    videoUrl: { type: String, label: 'Video url' },
    startDate: { type: Date, required: true, label: 'Start date', index: true },
    endDate: { type: Date, required: true, label: 'End date' },
    location: { type: locationSchema, label: 'Location' },
    isOnline: { type: Boolean, default: false, label: 'Is online' },
    onlineUrl: { type: String, label: 'Online url' },
    capacity: { type: Number, label: 'Capacity' },
    status: {
      type: String,
      enum: Object.values(EventStatus),
      default: EventStatus.DRAFT,
      label: 'Status',
    },
    ownerId: { type: String, label: 'Owner' },
    tagIds: { type: [String], default: [], label: 'Tags' },
    createdBy: { type: String, label: 'Created by' },
  },
  { timestamps: true },
);

eventSchema.index({ status: 1, startDate: -1 });
eventSchema.index({ ownerId: 1 });

export const savedEventSchema = new Schema<ISavedEventDocument>(
  {
    _id: mongooseStringRandomId,
    cpUserId: { type: String, required: true, label: 'Client portal user' },
    eventId: { type: String, required: true, label: 'Event' },
  },
  { timestamps: true },
);

savedEventSchema.index({ cpUserId: 1, eventId: 1 }, { unique: true });

export const eventAgendaSchema = new Schema<IEventAgendaDocument>(
  {
    _id: mongooseStringRandomId,
    eventId: { type: String, required: true, label: 'Event' },
    startTime: { type: String, required: true, label: 'Start time' },
    endTime: { type: String, required: true, label: 'End time' },
    title: { type: String, required: true, label: 'Title' },
    description: { type: String, label: 'Description' },
  },
  { timestamps: true },
);

eventAgendaSchema.index({ eventId: 1, startTime: 1 });
