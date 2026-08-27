import { useMutation, useQuery } from '@apollo/client';
import { useToast } from 'erxes-ui';
import { useCallback } from 'react';

import { OROLTSOO_PROFILE_UPDATE } from '../graphql/mutations/profileMutations';
import { OROLTSOO_PROFILE_INFO } from '../graphql/queries/profileQueries';
import { IProfile } from '../types/profile';

export const useProfileInfo = () => {
  const { data, loading, error } = useQuery<{
    oroltsooProfileInfo: IProfile;
  }>(OROLTSOO_PROFILE_INFO);

  return { profile: data?.oroltsooProfileInfo, loading, error };
};

export const useProfileUpdate = () => {
  const { toast } = useToast();

  const [mutate, { loading }] = useMutation<{
    oroltsooProfileUpdate: IProfile;
  }>(OROLTSOO_PROFILE_UPDATE);

  const updateProfile = useCallback(
    async (input: Record<string, unknown>) => {
      const result = await mutate({
        variables: { input },
        onError: (mutationError) =>
          toast({
            title: 'Хадгалж чадсангүй',
            description: mutationError.message,
            variant: 'destructive',
          }),
      });

      return Boolean(result?.data?.oroltsooProfileUpdate);
    },
    [mutate, toast],
  );

  return { updateProfile, loading };
};
