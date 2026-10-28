export type Condition = {
  id: string;
  [key: string]: unknown;
};

export type PlaceConditionUI = {
  id: string;

  productCategoryIds?: string[];
  excludeCategoryIds?: string[];

  productTagIds?: string[];
  excludeTagIds?: string[];

  excludeProductIds?: string[];
  segmentIds?: string[];

  ltCount?: number;
  gtCount?: number;

  ltUnitPrice?: number;
  gtUnitPrice?: number;

  segmentId?: string;

  subUomType?: string;

  placeEntityId?: string;
  responsibleEntityId?: string;
};

export type ProductPlacesReceiptProduct = {
  code?: string;
  name?: string;
};

export type ProductPlacesReceiptStock = {
  product?: ProductPlacesReceiptProduct;
  unitPrice: string | number;
  quantity: string | number;
  amount: string | number;
};

export type ProductPlacesReceiptEntity = {
  code?: string;
  title?: string;
};

export type ProductPlacesReceipt = {
  date: string;
  number?: string;
  place?: ProductPlacesReceiptEntity | null;
  responsible?: ProductPlacesReceiptEntity | null;
  customerCode?: string;
  customerName?: string;
  pDatas?: ProductPlacesReceiptStock[];
  amount: string | number;
  headerText?: string;
  footerText?: string;
};
export type ConfigValueItem = {
  key: string;
  value: unknown;
};

export type NormalizedConfig = Record<string, unknown>;
