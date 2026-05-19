import { Document } from 'mongoose';

export const COLLECTIVE_PACKAGE_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  ARCHIVED: 'archived',
  ALL: ['draft', 'active', 'archived'],
};

export interface ICollectivePackage {
  name?: string;
  description?: string;
  coverImage?: string;
  collectiveId: string;
  posToken: string;
  productIds: string[];
  price?: number;
  status?: string;
}

export interface ICollectivePackageDocument extends ICollectivePackage, Document {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CollectivePackageQueryParams {
  collectiveId: string;
  searchValue?: string;
  status?: string;
}
