import { OPPTY_STATUSES } from '../constants/oppty';

export interface IOpptyFilter {
  searchValue?: string;
  number?: string;
  description?: string;
  customerId?: string;
  unitType?: string;
  tenureType?: string;
  unit?: string;
  assignedUserId?: string;
  status?: string;
  priority?: string;
  startDate?: Date;
  targetDate?: Date;
  customerSource?: string;
  labelId?: string;
  tagId?: string;
}

export interface IPropertyRow {
  buildingId?: string;
  zoningId?: string;
  unitId?: string;
  isMain?: boolean;
}

export interface IBlockOpptyInput {
  number?: string;
  description: string;
  customerId: string;
  unitType?: string;
  tenureType?: string;
  unit?: string;
  units?: string[];
  propertyRows?: IPropertyRow[];
  blocks?: string[];
  assignedUserId?: string;
  status: (typeof OPPTY_STATUSES)[keyof typeof OPPTY_STATUSES];
  labelIds?: string[];
  tagIds?: string[];
  projectId?: string;
  startDate?: Date;
  targetDate?: Date;
  customerSource: string;
  propertiesData?: any;
}

export interface IOppty extends IBlockOpptyInput {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}
