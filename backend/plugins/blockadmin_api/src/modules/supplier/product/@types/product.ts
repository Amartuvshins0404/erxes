import { Document } from 'mongoose';
import { IBlock } from '~/types';

export interface IBaProduct {
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

export interface IBaProductDocument extends IBaProduct, Document {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBaProductBlockDocument extends IBaProductDocument, IBlock {}

export interface ProductQueryParams {
  supplierId?: string;
  categoryId?: string;
  status?: string;
  searchValue?: string;
}
