import { getEnv } from 'erxes-api-shared/utils';
import { generateModels } from '~/connectionResolvers';

export type MtoMode = 'master' | 'slave';

export const getMtoMode = (): MtoMode => {
  const mode = getEnv({ name: 'MTO_MODE', defaultValue: 'master' });
  if (mode === 'slave') {
    return 'slave';
  }
  return 'master';
};

export const getMtoMasterUrl = (): string | undefined => {
  return getEnv({ name: 'MTO_MASTER_URL' });
};

export const getMtoInstanceId = async (
  subdomain: string,
): Promise<string | undefined> => {
  const models = await generateModels(subdomain);
  const configInstance = await models.SystemConfig.getConfig('instanceId');
  return configInstance?.value;
};

export const isSlaveMode = (): boolean => {
  return getMtoMode() === 'slave';
};

export const isMasterMode = (): boolean => {
  return getMtoMode() === 'master';
};

export const getMtoSecret = (): string | undefined => {
  return getEnv({ name: 'MTO_AUTH_TOKEN' });
};
