import { useMutation } from '@apollo/client';
import {
  MTO_PROFILE_CREATE,
  MTO_PROFILE_UPDATE,
} from '@/profile/graphql/profileMutations';
import { MTO_MY_PROFILE } from '@/profile/graphql/profileQueries';
import { ProfileMutationVariables } from '@/profile/types/profile';

export function useSaveProfile() {
  const [create, { loading: creating }] = useMutation(MTO_PROFILE_CREATE, {
    refetchQueries: [{ query: MTO_MY_PROFILE }],
    awaitRefetchQueries: true,
  });
  const [update, { loading: updating }] = useMutation(MTO_PROFILE_UPDATE, {
    refetchQueries: [{ query: MTO_MY_PROFILE }],
    awaitRefetchQueries: true,
  });

  const saveProfile = async (
    profileId: string | undefined,
    variables: ProfileMutationVariables,
  ) => {
    if (profileId) {
      await update({ variables: { _id: profileId, ...variables } });
      return;
    }

    await create({ variables });
  };

  return { saveProfile, loading: creating || updating };
}
