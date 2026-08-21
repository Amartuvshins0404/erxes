import {
  AutomationConfigs,
  createCoreModuleProducerHandler,
  TAutomationProducers,
} from 'erxes-api-shared/core-modules';
import { generateModels } from '~/connectionResolvers';
import {
  eventAiKnowledgeProvider,
  EVENT_KNOWLEDGE_SOURCE_KEY,
} from '@/event/meta/automations';

const modules = {
  event: eventAiKnowledgeProvider,
};

export const automations = {
  constants: {
    triggers: [],
    ai: {
      knowledgeSources: [
        {
          key: EVENT_KNOWLEDGE_SOURCE_KEY,
          label: 'Events',
          moduleName: 'event',
          sourceSelector: 'remote-module',
        },
      ],
    },
  },

  loadAiKnowledgeDocumentBatch: createCoreModuleProducerHandler({
    moduleName: 'automations',
    modules,
    methodName: TAutomationProducers.LOAD_AI_KNOWLEDGE_DOCUMENT_BATCH,
    extractModuleName: (input) => input.moduleName,
    generateModels,
  }),
} as AutomationConfigs;
