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

// Association
import { IAssociationDocument } from '@/association/@types/association';
import {
  IAssociationModel,
  loadAssociationClass,
} from '@/association/db/models/Association';

// Event
import { IEventDocument } from '@/event/@types/event';
import { IEventModel, loadEventClass } from '@/event/db/models/Event';

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
  Association: IAssociationModel;
  Event: IEventModel;
  RegistrationApplication: IRegistrationApplicationModel;
  RegistrationFormSchema: IRegistrationFormSchemaModel;
}

export interface IContext extends IMainContext {
  models: IModels;
  subdomain: string;
  mode: MtoMode;
  instanceId?: string;
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

  models.Association = db.model<IAssociationDocument, IAssociationModel>(
    'mto_categories',
    loadAssociationClass(models),
  );

  models.Event = db.model<IEventDocument, IEventModel>(
    'mto_events',
    loadEventClass(models),
  );

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
