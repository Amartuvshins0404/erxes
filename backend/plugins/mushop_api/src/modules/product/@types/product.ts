import { Document } from 'mongoose';
import { IMushop } from '~/types';

export interface IMushopProduct {
  name?: string;
  shortName?: string;
  code?: string;
  type?: string;
  description?: string;
  barcodes?: string[];
  variants?: any;
  barcodeDescription?: string;
  unitPrice?: number;
  initialCategory?: any;
  categoryId?: string;
  vendorId?: string;
  propertiesData?: any;
  tagIds?: string[];
  attachment?: any;
  attachmentMore?: any[];
  scopeBrandIds?: string[];
  uom?: string;
  subUoms?: any;
  currency?: string;
  pdfAttachment?: any;
  offering?: any;
  status?: string;
  note?: string;
  state?: string;
}

export interface IMushopProductDocument extends IMushopProduct, Document {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMushopProductMushopDocument
  extends IMushopProductDocument,
    IMushop {}

export interface ProductQueryParams {
  supplierId?: string;
  categoryId?: string;
  status?: string;
  searchValue?: string;
}
