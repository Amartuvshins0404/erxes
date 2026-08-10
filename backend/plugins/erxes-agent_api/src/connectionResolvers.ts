import { createGenerateModels } from 'erxes-api-shared/utils';
import { IMainContext, IUserDocument } from 'erxes-api-shared/core-types';
import mongoose from 'mongoose';

import { IMastraAgentDocument } from '@/agent/@types/agent';
import { IMastraProviderDocument } from '@/provider/@types/provider';
import { IMastraSettingsDocument } from '@/settings/@types/settings';
import { IMastraWorkingMemoryDocument } from '@/memory/@types/workingMemory';
import { loadAgentClass, IMastraAgentModel } from '@/agent/db/models/Agent';
import {
  loadAgentActionLogClass,
  IMastraAgentActionLogModel,
} from '@/agent/db/models/AgentActionLog';
import { IMastraAgentActionLogDocument } from '@/agent/@types/agentActionLog';
import {
  loadProviderClass,
  IMastraProviderModel,
} from '@/provider/db/models/Provider';
import {
  loadSettingsClass,
  IMastraSettingsModel,
} from '@/settings/db/models/Settings';
import {
  loadWorkingMemoryClass,
  IMastraWorkingMemoryModel,
} from '@/memory/db/models/WorkingMemory';
import {
  loadArtifactClass,
  IMastraArtifactModel,
} from '@/artifact/db/models/Artifact';
import { IMastraArtifactDocument } from '@/artifact/@types/artifact';
import {
  IMastraSandboxSessionDocument,
  IMastraSandboxSessionModel,
} from '@/sandbox/@types/session';
import { sandboxSessionSchema } from '@/sandbox/db/definitions/session';

export interface IModels {
  MastraAgent: IMastraAgentModel;
  MastraAgentActionLog: IMastraAgentActionLogModel;
  MastraProvider: IMastraProviderModel;
  MastraSettings: IMastraSettingsModel;
  MastraWorkingMemory: IMastraWorkingMemoryModel;
  MastraArtifact: IMastraArtifactModel;
  MastraSandboxSession: IMastraSandboxSessionModel;
}

export interface IContext extends IMainContext {
  models: IModels;
  user: IUserDocument;
  subdomain: string;
}

/** Bind every plugin model class to the tenant's mongoose connection. */
export const loadClasses = (db: mongoose.Connection): IModels => {
  const models = {} as IModels;

  models.MastraAgent = db.model<IMastraAgentDocument, IMastraAgentModel>(
    'mastra_agents',
    loadAgentClass(models),
  );

  models.MastraAgentActionLog = db.model<
    IMastraAgentActionLogDocument,
    IMastraAgentActionLogModel
  >('mastra_agent_action_logs', loadAgentActionLogClass(models));

  models.MastraProvider = db.model<
    IMastraProviderDocument,
    IMastraProviderModel
  >('mastra_providers', loadProviderClass(models));

  models.MastraSettings = db.model<
    IMastraSettingsDocument,
    IMastraSettingsModel
  >('mastra_settings', loadSettingsClass(models));

  models.MastraWorkingMemory = db.model<
    IMastraWorkingMemoryDocument,
    IMastraWorkingMemoryModel
  >('mastra_working_memory', loadWorkingMemoryClass(models));

  models.MastraArtifact = db.model<
    IMastraArtifactDocument,
    IMastraArtifactModel
  >('mastra_artifacts', loadArtifactClass(models));

  models.MastraSandboxSession = db.model<
    IMastraSandboxSessionDocument,
    IMastraSandboxSessionModel
  >('mastra_sandbox_sessions', sandboxSessionSchema);

  return models;
};

export const generateModels = createGenerateModels<IModels>(loadClasses);
