export interface IMushopProductCategory {
  _id?: string;
  name?: string;
  code?: string;
}

export interface IMushopProductSupplier {
  _id?: string;
  name?: string;
  logo?: string;
}

export interface IProductList {
  list: IMushopProduct[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string;
    endCursor: string;
  };
  totalCount?: number;
}

export interface IMushopProduct {
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
  initialCategory?: IMushopProductCategory;
  categoryId?: string;
  vendorId?: string;
  supplier?: IMushopProductSupplier;
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
  category?: IMushopProductCategory;
  createdAt?: string;
  updatedAt?: string;
}
