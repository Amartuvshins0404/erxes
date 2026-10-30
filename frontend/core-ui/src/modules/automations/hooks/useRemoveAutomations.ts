import { AUTOMATION_REMOVE } from '@/automations/graphql/automationMutations';
import { OperationVariables, useMutation } from '@apollo/client';

export const useRemoveAutomations = () => {
  const [automationsRemove, { loading }] = useMutation(AUTOMATION_REMOVE);
  const removeAutomations = async (
    automationIds: string[],
    options?: OperationVariables,
  ) => {
    await automationsRemove({
      ...options,
      variables: { ids: automationIds, ...options?.variables },
    });
  };
  return { removeAutomations, loading };
};
