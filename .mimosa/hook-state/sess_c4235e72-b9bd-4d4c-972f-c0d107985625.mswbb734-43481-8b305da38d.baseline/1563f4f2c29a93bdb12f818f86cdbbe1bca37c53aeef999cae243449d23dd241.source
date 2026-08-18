import { useUpdateOppty } from './useUpdateOppty';

export const useOpptyCustomFieldEdit = () => {
  const { updateOppty, loading } = useUpdateOppty();
  return {
    mutate: (variables: { _id: string } & Record<string, unknown>) => {
      const { _id, ...rest } = variables;
      updateOppty({
        variables: { _id, input: rest },
      });
    },
    loading,
  };
};
