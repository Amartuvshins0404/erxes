export const ERXES_AGENT_ACTIONS = {
  agent: {
    readSummary: 'erxesAgentAgentsReadSummary',
    readConfig: 'erxesAgentAgentsReadConfig',
    chat: 'erxesAgentAgentsChat',
    create: 'erxesAgentAgentsCreate',
    update: 'erxesAgentAgentsUpdate',
    remove: 'erxesAgentAgentsRemove',
    share: 'erxesAgentAgentsShare',
    moderate: 'erxesAgentAgentsModerate',
    transferOwnership: 'erxesAgentAgentsTransferOwnership',
  },
  provider: {
    catalogRead: 'erxesAgentProvidersCatalogRead',
    configRead: 'erxesAgentProvidersConfigRead',
    manage: 'erxesAgentProvidersManage',
    remove: 'erxesAgentProvidersRemove',
  },
  settings: {
    statusRead: 'erxesAgentSettingsStatusRead',
    manage: 'erxesAgentSettingsManage',
    quotasManage: 'erxesAgentQuotasManage',
  },
} as const;
