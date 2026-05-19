import { createGenerateModels } from 'erxes-api-shared/utils';
import { IMainContext } from 'erxes-api-shared/core-types';
import mongoose from 'mongoose';
import { ScopedEventHandlers } from 'erxes-api-shared/core-modules';
import { IMushopSupplierDocument } from '@/supplier/@types/supplier';
import {
  loadSupplierClass,
  ISupplierModel,
} from '@/supplier/db/models/Supplier';
import { IMushopProductMushopDocument } from '@/product/@types/product';
import {
  loadMushopProductClass,
  IMushopProductModel,
} from '@/product/db/models/Product';
import { IMushopSubscriptionDocument } from '@/subscription/@types/mushopSubscription';
import {
  loadMushopSubscriptionClass,
  IMushopSubscriptionModel,
} from '@/subscription/db/models/MushopSubscription';
import { IMushopSubscriptionPlanDocument } from '@/subscription/@types/mushopSubscriptionPlan';
import {
  loadMushopSubscriptionPlanClass,
  IMushopSubscriptionPlanModel,
} from '@/subscription/db/models/MushopSubscriptionPlan';
import { ICollectiveDocument } from '@/collective/@types/collective';
import {
  loadCollectiveClass,
  ICollectiveModel,
} from '@/collective/db/models/Collective';
import { ICollectivePackageDocument } from '@/collective-package/@types/collectivePackage';
import {
  loadCollectivePackageClass,
  ICollectivePackageModel,
} from '@/collective-package/db/models/CollectivePackage';

export interface IModels {
  Supplier: ISupplierModel;
  MushopProduct: IMushopProductModel;
  MushopSubscription: IMushopSubscriptionModel;
  MushopSubscriptionPlan: IMushopSubscriptionPlanModel;
  Collective: ICollectiveModel;
  CollectivePackage: ICollectivePackageModel;
}

export interface IContext extends IMainContext {
  models: IModels;
  subdomain: string;
}

export const loadClasses = (
  db: mongoose.Connection,
  _subdomain: string,
  eventHandlers: ScopedEventHandlers,
): IModels => {
  const models = {} as IModels;
  const mushopEventHandlers = eventHandlers('mushop');

  models.Supplier = db.model<IMushopSupplierDocument, ISupplierModel>(
    'mushop_suppliers',
    loadSupplierClass(
      models,
      mushopEventHandlers('suppliers', 'mushop_suppliers'),
    ),
  );

  models.MushopProduct = db.model<
    IMushopProductMushopDocument,
    IMushopProductModel
  >(
    'mushop_products',
    loadMushopProductClass(
      models,
      mushopEventHandlers('products', 'mushop_products'),
    ),
  );

  models.MushopSubscription = db.model<
    IMushopSubscriptionDocument,
    IMushopSubscriptionModel
  >(
    'mushop_subscriptions',
    loadMushopSubscriptionClass(
      models,
      mushopEventHandlers('subscriptions', 'mushop_subscriptions'),
    ),
  );

  models.MushopSubscriptionPlan = db.model<
    IMushopSubscriptionPlanDocument,
    IMushopSubscriptionPlanModel
  >(
    'mushop_subscription_plans',
    loadMushopSubscriptionPlanClass(
      models,
      mushopEventHandlers('subscription_plans', 'mushop_subscription_plans'),
    ),
  );

  models.Collective = db.model<ICollectiveDocument, ICollectiveModel>(
    'mushop_collectives',
    loadCollectiveClass(models),
  );

  models.CollectivePackage = db.model<
    ICollectivePackageDocument,
    ICollectivePackageModel
  >(
    'mushop_collective_packages',
    loadCollectivePackageClass(models),
  );

  return models;
};

export const generateModels = createGenerateModels<IModels>(loadClasses);
