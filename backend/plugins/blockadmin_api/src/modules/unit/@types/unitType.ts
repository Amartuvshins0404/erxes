import { Document } from 'mongoose';
import { IProjectPrice } from '~/modules/project/@types/project';
import { IBlock } from '~/types';

export interface IUnitRoom {
  type: string;
  size: number;
  count: number;
}

export interface IUnitType extends IBlock {
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

  coverImage: string;
  images: string[];
  planImages: string[];

  project: string;
}

export interface IUnitTypeDocument extends IUnitType, Document {
  _id: string;

  createdAt: Date;
  updatedAt: Date;
}

export interface IUnitTypeParams {
  project: string;
}
