import { IMainContext } from 'erxes-api-shared/core-types';
import { createGenerateModels } from 'erxes-api-shared/utils';
import mongoose from 'mongoose';

import { IMeetingDocument } from '@/meeting/@types/meeting';
import { IMeetingModel, loadMeetingClass } from '@/meeting/db/models/Meeting';
import { IPostDocument } from '@/post/@types/post';
import { IPostModel, loadPostClass } from '@/post/db/models/Post';
import { IProfileDocument } from '@/profile/@types/profile';
import { IProfileModel, loadProfileClass } from '@/profile/db/models/Profile';

export interface IModels {
  Profile: IProfileModel;
  Post: IPostModel;
  Meeting: IMeetingModel;
}

export interface IContext extends IMainContext {
  models: IModels;
  subdomain: string;
}

export const loadClasses = (db: mongoose.Connection): IModels => {
  const models = {} as IModels;

  models.Profile = db.model<IProfileDocument, IProfileModel>(
    'oroltsoo_admin_profiles',
    loadProfileClass(models),
  );

  models.Post = db.model<IPostDocument, IPostModel>(
    'oroltsoo_admin_posts',
    loadPostClass(models),
  );

  models.Meeting = db.model<IMeetingDocument, IMeetingModel>(
    'oroltsoo_admin_meetings',
    loadMeetingClass(models),
  );

  return models;
};

export const generateModels = createGenerateModels<IModels>(loadClasses);
