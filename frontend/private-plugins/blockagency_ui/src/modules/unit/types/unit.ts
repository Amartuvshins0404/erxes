import { IUnit } from 'ui-modules/modules/structure/types/Unit';

export type BlockUnitStatus =
  | 'vacant'
  | 'reserved'
  | 'leased'
  | 'leaseExpireSoon'
  | 'leaseRenewal'
  | 'underFitout'
  | 'cancelled'
  | 'internalUse'
  | 'onHold';

export interface IBlockAgencyUnit {
  _id: string;
  blockUnitId: string;
  unitNumber?: string;
  agencyId: string;
  blockSubdomain: string;
  agencySubdomain: string;
  blockDeveloperName?: string;
  agency?: { name?: string };
  memberId?: string;
  status?: BlockUnitStatus;
  assignedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  member?: IUnit;
}

export interface IUnitStatusCounts {
  vacant: number;
  reserved: number;
  leased: number;
}
