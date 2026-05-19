import { IProjectPrice } from '@/project/types/projectTypes';

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

export interface IUnitActiveContract {
  _id: string;
  status?: string;
  statusType?: string;
  statusLabel?: string;
  statusColor?: string;
}

export interface IUnit {
  _id: string;
  number: string;
  type: string;
  unitType: IUnitType;
  zoning: string;
  building: string;
  status: string;
  activeContract?: IUnitActiveContract | null;
  blockSubdomain?: string;
  blockEntityId?: string;
  agencySubdomain?: string;
  agencyEntityId?: string;
  projectData?: { _id: string; name?: string } | null;
  locked?: boolean;
}

export interface IUnitAttachment {
  _id?: string;
  attachment?: string;
}
