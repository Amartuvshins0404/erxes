import { useMutation } from '@apollo/client';
import { UPDATE_NEWS_GENERAL_INFO } from '../graphql/newsMutations';
import { INewsGeneralInput } from '../types/newsTypes';
import { toast } from 'erxes-ui';

export const useUpdateNewsGeneralInfo = () => {
  const [updateNewsGeneralInfoMutation] = useMutation(UPDATE_NEWS_GENERAL_INFO);

  const updateNewsGeneralInfo = (
    id: string,
    input: Partial<INewsGeneralInput>,
  ) => {
    updateNewsGeneralInfoMutation({
      variables: { id, input },
      update: (cache, { data: { btkUpdateNewsGeneralInfo } }) => {
        cache.modify({
          id: cache.identify(btkUpdateNewsGeneralInfo),
          fields: Object.keys(input).reduce(
            (fields: Record<string, () => any>, field) => {
              fields[field] = () => input[field as keyof INewsGeneralInput];
              return fields;
            },
            {},
          ),
          optimistic: true,
        });
      },
      onCompleted: () => {
        toast({
          title: 'Success',
          description: 'News updated successfully',
        });
      },
      onError: (error) => {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };

  return { updateNewsGeneralInfo };
};
