export interface IAdminListingLocation {
  city?: string;
  district?: string;
  subDistrict?: string;
  short?: string;
}

export interface IAdminListingPricing {
  amount?: number;
  currency?: string;
  priceType?: string;
}

export interface IAdminListingSpecs {
  area?: number;
  floor?: number;
  totalFloors?: number;
  rooms?: number;
  builtYear?: string;
}

export interface IAdminListing {
  _id: string;
  entityId?: string;
  subdomain?: string;
  title: string;
  type: 'sale' | 'rent' | 'lease';
  propertyType: string;
  status: 'active' | 'inactive' | 'sold' | 'draft';
  description?: string;
  location?: IAdminListingLocation;
  pricing?: IAdminListingPricing;
  specs?: IAdminListingSpecs;
  mediaAttachments?: string[];
  featuredImg?: string;
  viewCount?: number;
  isFeatured?: boolean;
  createdAt?: string;
  updatedAt?: string;
  agent?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  agencyId?: string;
}

export interface IAdminListingStats {
  total: number;
  active: number;
  draft: number;
  totalViews: number;
}

export interface AdminListingFilter {
  [key: string]: string | undefined;
  subdomain?: string;
  searchValue?: string;
  status?: string;
  agencyId?: string;
  city?: string;
  district?: string;
}
