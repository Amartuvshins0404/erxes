import { IProjectPrice } from '@/project/types/projectTypes';

export interface IUnit {
  _id: string;
  number: string;
  type: string;
  zoning: string;
  building: string;
  status: string;
  isFeatured: boolean;
  agencyEntityId?: string;
  agencySubdomain?: string;
}

export interface IUnitRoom {
  type: string;
  count: number;
}

export interface IUnitType {
  _id: string;
  name: string;
  description: string;
  size: number;
  type: string;
  subTypes: string[];
  featureTypes: string[];
  areaType: string;
  tenureTypes: string[];
  content: string;
  price: number;
  prices: IProjectPrice[];
  status: string;
  rooms: IUnitRoom[];
  roomsCount: number;
  project: string;
  coverImage: string;
  images: string[];
  planImages: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IUnitAttachment {
  _id?: string;
  attachment?: string;
}
