export interface IAttachment {
  url?: string;
  name?: string;
  size?: number;
  type?: string;
}

export interface IUser {
  _id: string;
  email?: string | null;
  details?: {
    fullName?: string | null;
  } | null;
}

export interface ICustomer {
  _id: string;
  firstName?: string | null;
  lastName?: string | null;
  primaryEmail?: string | null;
  primaryPhone?: string | null;
}

export interface ICompany {
  _id: string;
  primaryName?: string | null;
  website?: string | null;
}

export interface ITag {
  _id: string;
  name?: string | null;
  colorCode?: string | null;
}

export interface ICarCustomFieldValue {
  field?: string;
  value?: unknown;
  stringValue?: string;
  numberValue?: number;
  dateValue?: string | Date;
  locationValue?: {
    type?: string;
    coordinates?: number[];
  };
}

export interface ICarCategory {
  _id: string;
  name?: string | null;
  description?: string | null;
  parentId?: string | null;
  code: string;
  order: string;
  isRoot?: boolean | null;
  carCount?: number | null;
  image?: IAttachment | null;
  secondaryImages?: IAttachment[] | null;
  productCategoryId?: string | null;
}

export interface ICar {
  _id: string;
  createdAt?: string | null;
  modifiedAt?: string | null;
  ownerId?: string | null;
  owner?: IUser | null;
  mergedIds?: string[] | null;
  description?: string | null;
  plateNumber?: string | null;
  vinNumber?: string | null;
  colorCode?: string | null;
  categoryId?: string | null;
  category?: ICarCategory | null;
  bodyType?: string | null;
  fuelType?: string | null;
  gearBox?: string | null;
  vintageYear?: number | null;
  importYear?: number | null;
  attachment?: IAttachment | null;
  customFieldsData?: ICarCustomFieldValue[] | Record<string, unknown> | null;
  tagIds?: string[] | null;
  getTags?: ITag[] | null;
  customers?: ICustomer[] | null;
  companies?: ICompany[] | null;
}

export interface ICarsMainResponse {
  list: ICar[];
  totalCount: number;
}

export interface ICarCounts {
  bySegment?: Record<string, number>;
  byTag?: Record<string, number>;
}

export interface ISegment {
  _id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  contentType?: string | null;
  order?: string | null;
  count?: number | null;
  subOf?: string | null;
}

export interface ICarFilters {
  page: number;
  perPage: number;
  categoryId: string | null;
  tag: string | null;
  segment: string | null;
  segmentData: string | null;
  searchValue: string | null;
  sortField: string | null;
  sortDirection: number | null;
  ids: string[] | null;
}

export interface ICarFormValues {
  ownerId: string;
  description: string;
  plateNumber: string;
  vinNumber: string;
  colorCode: string;
  categoryId: string;
  bodyType: string;
  fuelType: string;
  gearBox: string;
  vintageYear: number | null;
  importYear: number | null;
  attachment?: IAttachment | null;
}

export interface ICarCategoryFormValues {
  name: string;
  code: string;
  description: string;
  parentId: string;
  image?: IAttachment | null;
  secondaryImages: IAttachment[];
  productCategoryId: string;
}

export interface ICategoryTreeNode extends ICarCategory {
  children: ICategoryTreeNode[];
  depth: number;
}
