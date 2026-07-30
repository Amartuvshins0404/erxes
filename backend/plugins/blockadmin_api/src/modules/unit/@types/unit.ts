import { Document } from 'mongoose';
import { IBlock } from '~/types';

export interface IUnit extends IBlock {
  zoning: string;
  number: string;
  status: string;
  type: string;
  isFeatured: boolean;
  agencySubdomain?: string;
  agencyEntityId?: string;
  locked?: boolean;
}

export interface IUnitInput extends IUnit {
  useProjectPrice: boolean;
}

export interface ITransferUnit {
  blockSubdomain: string;
  unitId: string;
  agencySubdomain: string;
  agencyId: string;
}

export interface ITransferUnitPayload {
  agencySubdomain: string;
  agencyEntityId: string;
}

export interface IUnitDocument extends IUnit, Document {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}
