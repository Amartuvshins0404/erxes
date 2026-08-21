import { IMainContext } from 'erxes-api-shared/core-types';
import { createGenerateModels } from 'erxes-api-shared/utils';
import mongoose from 'mongoose';
import {
  IEventAgendaDocument,
  IEventDocument,
  ISavedEventDocument,
} from '@/event/@types/event';
import {
  IEventAgendaModel,
  loadEventAgendaClass,
} from '@/event/db/models/EventAgendas';
import { IEventModel, loadEventClass } from '@/event/db/models/Events';
import {
  ISavedEventModel,
  loadSavedEventClass,
} from '@/event/db/models/SavedEvents';
import { IEventInvitationDocument } from '@/invitation/@types/invitation';
import {
  IInvitationModel,
  loadInvitationClass,
} from '@/invitation/db/models/Invitations';

export interface IModels {
  Events: IEventModel;
  EventAgendas: IEventAgendaModel;
  SavedEvents: ISavedEventModel;
  Invitations: IInvitationModel;
}

export interface IContext extends IMainContext {
  models: IModels;
  subdomain: string;
}

export const loadClasses = (db: mongoose.Connection): IModels => {
  const models = {} as IModels;

  models.Events = db.model<IEventDocument, IEventModel>(
    'event_events',
    loadEventClass(models),
  );

  models.EventAgendas = db.model<IEventAgendaDocument, IEventAgendaModel>(
    'event_agendas',
    loadEventAgendaClass(models),
  );

  models.SavedEvents = db.model<ISavedEventDocument, ISavedEventModel>(
    'event_saved_events',
    loadSavedEventClass(models),
  );

  models.Invitations = db.model<IEventInvitationDocument, IInvitationModel>(
    'event_invitations',
    loadInvitationClass(models),
  );

  return models;
};

export const generateModels = createGenerateModels<IModels>(loadClasses);
