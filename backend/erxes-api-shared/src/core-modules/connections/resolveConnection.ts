import { ExpectedError, sendTRPCMessage } from '../../utils';
import { IResolvedConnection } from './types';

export const resolveConnection = async ({
  subdomain,
  connectionId,
}: {
  subdomain: string;
  connectionId: string;
}): Promise<IResolvedConnection> => {
  const connection = (await sendTRPCMessage({
    subdomain,
    pluginName: 'core',
    method: 'query',
    module: 'connections',
    action: 'resolve',
    input: { _id: connectionId },
    throwOnError: true,
  })) as IResolvedConnection | undefined;

  if (!connection) {
    throw new ExpectedError('Connection not found', 'NOT_FOUND');
  }

  return connection;
};
