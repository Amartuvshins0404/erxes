import { useMutation, useQuery } from '@apollo/client';
import { toast } from 'erxes-ui';
import { useAtom } from 'jotai';
import { currentUserState } from 'ui-modules';
import {
  GET_MEMBER_USER_DETAIL,
  UPDATE_MEMBER_USER_PROFILE,
} from '../graphql';
import {
  IBlockAgencyMemberUser,
  IBlockAgencyUserDetails,
} from '../types/member';

type QueryResponse = {
  userDetail: IBlockAgencyMemberUser;
};

type MutationResponse = {
  usersEditProfile: IBlockAgencyMemberUser;
};

export type TUploadValue = { url?: string } | string;

const toUrl = (value: TUploadValue) =>
  typeof value === 'string' ? value : value?.url;

const preserveFullName = (
  details: IBlockAgencyUserDetails,
): IBlockAgencyUserDetails => {
  if (details.firstName || details.lastName || !details.fullName) {
    return details;
  }

  const [firstName, ...rest] = details.fullName.trim().split(/\s+/);

  return { ...details, firstName, lastName: rest.join(' ') };
};

const toDetailsInput = (
  user: IBlockAgencyMemberUser,
  avatar?: string,
): IBlockAgencyUserDetails => {
  const { __typename, ...details } = user.details ?? {};

  return preserveFullName({ ...details, avatar: avatar ?? '' });
};

export const useUpdateMemberAvatar = () => {
  const [currentUser, setCurrentUser] = useAtom(currentUserState);

  const { data, loading } = useQuery<QueryResponse>(GET_MEMBER_USER_DETAIL, {
    variables: { _id: currentUser?._id },
    skip: !currentUser?._id,
  });

  const [updateUserProfile, { loading: updating }] =
    useMutation<MutationResponse>(UPDATE_MEMBER_USER_PROFILE);

  const user = data?.userDetail;

  const onAvatarChange = (value: TUploadValue) => {
    if (!user) {
      return;
    }

    updateUserProfile({
      variables: {
        username: user.username ?? '',
        email: user.email ?? '',
        details: toDetailsInput(user, toUrl(value)),
      },
      onCompleted: ({ usersEditProfile }) => {
        setCurrentUser((prev) =>
          prev
            ? {
                ...prev,
                details: {
                  ...prev.details,
                  avatar: usersEditProfile.details?.avatar ?? undefined,
                  fullName: usersEditProfile.details?.fullName ?? undefined,
                },
              }
            : prev,
        );

        toast({ title: 'Profile picture updated', variant: 'success' });
      },
      onError: (error) => {
        toast({
          title: 'Could not update the profile picture',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };

  return {
    avatar: user?.details?.avatar ?? undefined,
    onAvatarChange,
    loading,
    updating,
  };
};
