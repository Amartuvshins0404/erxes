import { useMutation } from '@apollo/client';
import {
  BTK_ADD_NEWS_MEMBERS,
  BTK_DELETE_NEWS_MEMBER,
  BTK_UPDATE_NEWS_MEMBER,
} from '../graphql/newsMutations';
import { toast } from 'erxes-ui';
import { BTK_GET_NEWS_MEMBERS } from '~/modules/news/graphql/newsQueries';
import { useParams } from 'react-router';

export const useAddNewsMembers = () => {
  const [addNewsMembers, { loading, error }] =
    useMutation(BTK_ADD_NEWS_MEMBERS);
  return { addNewsMembers, loading, error };
};

export const useUpdateNewsMember = () => {
  const [updateNewsMember, { loading, error }] = useMutation(
    BTK_UPDATE_NEWS_MEMBER,
  );

  const handleUpdateNewsMember = ({
    projectMemberId,
    role,
  }: {
    projectMemberId: string;
    role: string;
  }) => {
    updateNewsMember({
      variables: { id: projectMemberId, role },
      onCompleted: () => {
        toast({ title: 'Successfully updated news member role' });
      },
      onError: (error) => {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      },
      update: (cache, { data }) => {
        cache.modify({
          id: cache.identify(data.btkUpdateNewsMember),
          fields: {
            role: () => role,
          },
          optimistic: true,
        });
      },
    });
  };

  return { handleUpdateNewsMember, loading, error };
};

export const useDeleteNewsMember = () => {
  const { id } = useParams();
  const [deleteNewsMember, { loading, error }] = useMutation(
    BTK_DELETE_NEWS_MEMBER,
    {
      onCompleted: () => {
        toast({ title: 'Successfully deleted news member' });
      },
      onError: (error) => {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      },
      refetchQueries: [
        { query: BTK_GET_NEWS_MEMBERS, variables: { news: id } },
      ],
    },
  );
  return { deleteNewsMember, loading, error };
};
