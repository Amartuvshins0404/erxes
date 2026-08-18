import { IPageInfo } from 'ui-modules';

export interface ICollectiveSupplier {
  _id: string;
  name?: string;
  logo?: string;
  verificationStatus?: string;
}

export interface ICollectiveSyncResult {
  supplierId: string;
  supplier?: ICollectiveSupplier | null;
  subdomain?: string;
  total?: number;
  created?: number;
  failed?: number;
  errors?: string[];
}

export interface ICollective {
  _id: string;
  name?: string;
  description?: string;
  targetSubdomain?: string;
  supplierIds?: string[];
  suppliers?: ICollectiveSupplier[];
  status?: string;
  syncResults?: ICollectiveSyncResult[];
  totalCreated?: number;
  totalFailed?: number;
  lastSyncedAt?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ICollectiveList {
  list: ICollective[];
  pageInfo: IPageInfo;
  totalCount?: number;
}
