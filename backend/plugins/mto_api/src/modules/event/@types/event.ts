import { Document } from 'mongoose';
import {
  IMultilingualString,
  IMultilingualStringOptional,
} from '@/provider/@types/provider';

export enum EventStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
}

export interface IEvent {
  title: IMultilingualString;
  description?: IMultilingualStringOptional;
  image?: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  categoryIds?: string[];
  status?: EventStatus;
  isActive?: boolean;
  createdAt?: Date;
  modifiedAt?: Date;
}

export interface IEventDocument extends Document, IEvent {
  _id: string;
  createdAt: Date;
  modifiedAt: Date;
}
