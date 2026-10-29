import { useMutation } from '@apollo/client';
import { useCallback } from 'react';

import { AGENTS_MODEL_VERIFY } from '../graphql/connection';
import type {
  IAgentsModelVerifyData,
  IAgentsModelVerifyVariables,
} from '../graphql/connection';

export const useAgentsModelVerify = (): ((
  connectionId: string,
  model: string,
) => Promise<string | null>) => {
  const [verify] = useMutation<
    IAgentsModelVerifyData,
    IAgentsModelVerifyVariables
  >(AGENTS_MODEL_VERIFY);

  return useCallback(
    async (connectionId: string, model: string) => {
      try {
        const { data } = await verify({ variables: { connectionId, model } });
        const result = data?.agentsModelVerify;

        if (result?.ok) {
          return null;
        }

        return result?.error || `Could not use "${model}".`;
      } catch (error: unknown) {
        return error instanceof Error
          ? error.message
          : `Could not check "${model}".`;
      }
    },
    [verify],
  );
};
