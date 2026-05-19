import { createGenerateModels } from 'erxes-api-shared/utils';
import { IMainContext } from 'erxes-api-shared/core-types';
import { ScopedEventHandlers } from 'erxes-api-shared/core-modules';
import mongoose from 'mongoose';

import { ISupplierDocument } from '@/supplier/@types/supplier';
import {
  loadSupplierClass,
  ISupplierModel,
} from '@/supplier/db/models/Supplier';
import { ICollectiveDocument } from '@/collective/@types/collective';
import {
  loadCollectiveClass,
  ICollectiveModel,
} from '@/collective/db/models/Collective';

export interface IModels {
  Supplier: ISupplierModel;
  Collective: ICollectiveModel;
}

export interface IContext extends IMainContext {
  models: IModels;
  subdomain: string;
}

export const loadClasses = (
  db: mongoose.Connection,
  subdomain: string,
  eventHandlers: ScopedEventHandlers,
): IModels => {
  const models = {} as IModels;
  const supplierEventHandlers = eventHandlers('supplier');

  models.Supplier = db.model<ISupplierDocument, ISupplierModel>(
    'suppliers',
    loadSupplierClass(models, supplierEventHandlers('suppliers', 'suppliers')),
  );

  models.Collective = db.model<ICollectiveDocument, ICollectiveModel>(
    'collectives',
    loadCollectiveClass(models),
  );

  return models;
};

export const generateModels = createGenerateModels<IModels>(loadClasses);
