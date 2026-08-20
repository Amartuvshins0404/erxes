import { Document } from 'mongoose';
import {
  IMultilingualString,
  IMultilingualStringOptional,
} from '@/provider/@types/provider';

export interface ITravelAssociation {
  title: IMultilingualString;
  description?: IMultilingualStringOptional;
  logo?: string;
  cover?: string;
  foundDate: Date;
  createdAt?: Date;
  modifiedAt?: Date;
}

export interface ITravelAssociationDocument
  extends Document,
    ITravelAssociation {
  _id: string;
  createdAt: Date;
  modifiedAt: Date;
}
