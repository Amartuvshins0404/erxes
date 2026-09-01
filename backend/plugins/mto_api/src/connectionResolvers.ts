import { IMainContext } from 'erxes-api-shared/core-types';
import { createGenerateModels } from 'erxes-api-shared/utils';
import mongoose from 'mongoose';
import { MasterClient } from '~/utils/masterClient';
import { MtoMode } from '~/constants/mode';

// Provider
import { IProviderDocument } from '@/provider/@types/provider';
import {
  IProviderModel,
  loadProviderClass,
} from '@/provider/db/models/Provider';

// Config
import { ISystemConfigDocument } from '@/config/@types/config';
import {
  ISystemConfigModel,
  loadSystemConfigClass,
} from '@/config/db/models/Config';

// Category
import { ICategoryDocument } from '@/category/@types/category';
import {
  ICategoryModel,
  loadCategoryClass,
} from '@/category/db/models/Category';

// Event
import { IEventDocument } from '@/event/@types/event';
import { IEventModel, loadEventClass } from '@/event/db/models/Event';

// Travel Association
import { ITravelAssociationDocument } from '@/travelAssociation/@types/travelAssociation';
import {
  ITravelAssociationModel,
  loadTravelAssociationClass,
} from '@/travelAssociation/db/models/TravelAssociation';

// Registration
import { IRegistrationApplicationDocument } from '@/registration/@types/registrationApplicationDocument';
import {
  IRegistrationApplicationModel,
  loadRegistrationApplicationClass,
} from '@/registration/db/models/RegistrationApplication';
import { IRegistrationFormSchemaDocument } from '@/registration/@types/registrationFormSchema';
import {
  IRegistrationFormSchemaModel,
  loadRegistrationFormSchemaClass,
} from '@/registration/db/models/RegistrationFormSchema';

export interface IModels {
  Provider: IProviderModel;
  SystemConfig: ISystemConfigModel;
  Category: ICategoryModel;
  Event: IEventModel;
  TravelAssociation: ITravelAssociationModel;
  RegistrationApplication: IRegistrationApplicationModel;
  RegistrationFormSchema: IRegistrationFormSchemaModel;
}

export interface IContext extends IMainContext {
  models: IModels;
  subdomain: string;
  mode: MtoMode;
  instanceId?: string;
  instanceIdFromHeader?: string;
  masterClient?: MasterClient;
  masterUrl?: string;
}

export const loadClasses = (db: mongoose.Connection): IModels => {
  const models = {} as IModels;

  models.Provider = db.model<IProviderDocument, IProviderModel>(
    'mto_providers',
    loadProviderClass(models),
  );

  models.SystemConfig = db.model<ISystemConfigDocument, ISystemConfigModel>(
    'mto_system_configs',
    loadSystemConfigClass(models),
  );

  models.Category = db.model<ICategoryDocument, ICategoryModel>(
    'mto_categories',
    loadCategoryClass(models),
  );

  models.Event = db.model<IEventDocument, IEventModel>(
    'mto_events',
    loadEventClass(models),
  );

  models.TravelAssociation = db.model<
    ITravelAssociationDocument,
    ITravelAssociationModel
  >('mto_travel_associations', loadTravelAssociationClass(models));

  models.RegistrationApplication = db.model<
    IRegistrationApplicationDocument,
    IRegistrationApplicationModel
  >('mto_registration_applications', loadRegistrationApplicationClass(models));

  models.RegistrationFormSchema = db.model<
    IRegistrationFormSchemaDocument,
    IRegistrationFormSchemaModel
  >('mto_registration_form_schemas', loadRegistrationFormSchemaClass(models));

  return models;
};

export const generateModels = createGenerateModels<IModels>(loadClasses);
