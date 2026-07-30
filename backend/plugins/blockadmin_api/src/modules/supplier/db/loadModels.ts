import mongoose from 'mongoose';
import { IModels } from '~/connectionResolvers';
import { IBaSupplierDocument } from '@/supplier/profile/@types/supplier';
import {
  ISupplierModel,
  loadSupplierClass,
} from '@/supplier/profile/db/models/Supplier';
import { IBaProductBlockDocument } from '@/supplier/product/@types/product';
import {
  IBaProductModel,
  loadBaProductClass,
} from '@/supplier/product/db/models/Product';

export interface ISupplierModels {
  Supplier: ISupplierModel;
  SupplierProduct: IBaProductModel;
}

export const loadSupplierModels = (
  models: IModels,
  db: mongoose.Connection,
) => {
  models.Supplier = db.model<IBaSupplierDocument, ISupplierModel>(
    'block_admin_suppliers',
    loadSupplierClass(models),
  );

  models.SupplierProduct = db.model<IBaProductBlockDocument, IBaProductModel>(
    'block_admin_supplier_products',
    loadBaProductClass(models),
  );
};
