import { IContext } from '~/connectionResolvers';
import { isSlaveMode } from '~/constants/mode';

export class OwnershipError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OwnershipError';
  }
}

export const validateProviderOwnership = async (
  context: IContext,
  providerId: string,
): Promise<void> => {
  if (!isSlaveMode() || !context.instanceId) {
    return;
  }

  if (!context.masterClient) {
    throw new Error('Master client is not available');
  }

  const query = `
    query GetProfile($id: String!) {
      mtoProfile(_id: $id) {
        _id
        instanceId
      }
    }
  `;

  try {
    const result = await context.masterClient.query<{
      mtoProfile: { _id: string; instanceId?: string } | null;
    }>(query, { id: providerId });

    const provider = result.mtoProfile;

    if (!provider) {
      throw new OwnershipError('Provider not found');
    }

    if (provider.instanceId !== context.instanceId) {
      throw new OwnershipError(
        'You can only modify data that belongs to your instance.',
      );
    }
  } catch (error: any) {
    if (error instanceof OwnershipError) {
      throw error;
    }
    throw new Error(`Failed to validate provider ownership: ${error.message}`);
  }
};

export const validateProviderOwnershipByProvider = (
  context: IContext,
  provider: { instanceId?: string } | null | undefined,
): void => {
  if (!isSlaveMode() || !context.instanceId) {
    return;
  }

  if (!provider) {
    throw new OwnershipError('Provider not found');
  }

  if (provider.instanceId !== context.instanceId) {
    throw new OwnershipError(
      'You can only modify data that belongs to your instance.',
    );
  }
};

export const ensureInstanceId = (context: IContext): string | undefined => {
  if (isSlaveMode() && context.instanceId) {
    return context.instanceId;
  }
  return undefined;
};

export const validateProviderOwnershipByActivityType = async (
  context: IContext,
  activityTypeId: string,
): Promise<void> => {
  if (!isSlaveMode() || !context.instanceId) {
    return;
  }

  if (!context.masterClient) {
    throw new Error('Master client is not available');
  }

  const query = `
    query GetActivityType($id: String!) {
      mtoActivityType(_id: $id) {
        _id
        provider {
          _id
          instanceId
        }
      }
    }
  `;

  try {
    const result = await context.masterClient.query<{
      mtoActivityType: {
        _id: string;
        provider: { _id: string; instanceId?: string } | null;
      } | null;
    }>(query, { id: activityTypeId });

    const activityType = result.mtoActivityType;

    if (!activityType || !activityType.provider) {
      throw new OwnershipError('Activity type or provider not found');
    }

    if (activityType.provider.instanceId !== context.instanceId) {
      throw new OwnershipError(
        'You can only modify data that belongs to your instance.',
      );
    }
  } catch (error: any) {
    if (error instanceof OwnershipError) {
      throw error;
    }
    throw new Error(
      `Failed to validate activity type ownership: ${error.message}`,
    );
  }
};

export const validateProviderOwnershipByProviderId = async (
  context: IContext,
  providerId: string,
): Promise<void> => {
  await validateProviderOwnership(context, providerId);
};
