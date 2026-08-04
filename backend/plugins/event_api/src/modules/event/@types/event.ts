import { Document } from 'mongoose';
import { EventStatus, EventTab } from '@/event/constants';

export interface IEventAgendaItem {
  startTime: string;
  endTime: string;
  title: string;
  description?: string;
}

export interface IEventAgenda extends IEventAgendaItem {
  eventId: string;
}

export interface IEventAgendaDocument extends IEventAgenda, Document {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEventLocation {
  city?: string;
  district?: string;
  address?: string;
  lat?: number;
  lng?: number;
}

export interface IEvent {
  name: string;
  description?: string;
  coverImage?: string;
  images?: string[];
  videoUrl?: string;
  startDate: Date;
  endDate: Date;
  location?: IEventLocation;
  isOnline?: boolean;
  onlineUrl?: string;
  capacity?: number;
  status?: EventStatus;
  ownerId?: string;
  tagIds?: string[];
  createdBy?: string;
}

export interface IEventDocument extends IEvent, Document {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEventInput extends IEvent {
  agenda?: IEventAgendaItem[];
}

export interface ISavedEvent {
  cpUserId: string;
  eventId: string;
}

export interface ISavedEventDocument extends ISavedEvent, Document {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventQueryParams {
  searchValue?: string;
  status?: string;
  tab?: EventTab;
  ownerId?: string;
  startDateFrom?: Date;
  startDateTo?: Date;
  ids?: string[];
}

export interface CpEventQueryParams extends EventQueryParams {
  cpUserId: string;
}
