export interface IBaProductCategory {
  _id?: string;
  name?: string;
  code?: string;
}

export interface IBaProductSupplier {
  _id?: string;
  name?: string;
  logo?: string;
}

export interface IProductList {
  list: IBaProduct[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string;
    endCursor: string;
  };
  totalCount?: number;
}

export interface IBaProduct {
  _id: string;
  name?: string;
  shortName?: string;
  code?: string;
  type?: string;
  description?: string;
  barcodes?: string[];
  variants?: any;
  barcodeDescription?: string;
  unitPrice?: number;
  initialCategory?: IBaProductCategory;
  categoryId?: string;
  vendorId?: string;
  supplier?: IBaProductSupplier;
  propertiesData?: any;
  tagIds?: string[];
  attachment?: any;
  attachmentMore?: any[];
  scopeBrandIds?: string[];
  uom?: string;
  subUoms?: any;
  currency?: string;
  pdfAttachment?: any;
  status?: string;
  category?: IBaProductCategory;
  createdAt?: string;
  updatedAt?: string;
}
