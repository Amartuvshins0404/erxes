import { useMutation } from '@apollo/client';
import {
  BLOCK_ADD_PROJECT_MEMBERS,
  BLOCK_DELETE_PROJECT_MEMBER,
  BLOCK_UPDATE_PROJECT_MEMBER,
} from '../graphql/projectMutations';
import { toast } from 'erxes-ui';
import { BLOCK_GET_PROJECT_MEMBERS } from '@/project/graphql/projectQueries';
import { useParams } from 'react-router';

export const useAddProjectMembers = () => {
  const [addProjectMembers, { loading, error }] = useMutation(
    BLOCK_ADD_PROJECT_MEMBERS,
  );
  return { addProjectMembers, loading, error };
};

export const useUpdateProjectMember = () => {
  const [updateProjectMember, { loading, error }] = useMutation(
    BLOCK_UPDATE_PROJECT_MEMBER,
  );

  const handleUpdateProjectMember = ({
    projectMemberId,
    role,
  }: {
    projectMemberId: string;
    role: string;
  }) => {
    updateProjectMember({
      variables: { id: projectMemberId, role },
      onCompleted: () => {
        toast({ title: 'Successfully updated project member role' });
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
          id: cache.identify(data.blockUpdateProjectMember),
          fields: {
            role: () => role,
          },
          optimistic: true,
        });
      },
    });
  };

  return { handleUpdateProjectMember, loading, error };
};

export const useDeleteProjectMember = () => {
  const { id } = useParams();
  const [deleteProjectMember, { loading, error }] = useMutation(
    BLOCK_DELETE_PROJECT_MEMBER,
    {
      onCompleted: () => {
        toast({ title: 'Successfully deleted project member' });
      },
      onError: (error) => {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      },
      refetchQueries: [
        { query: BLOCK_GET_PROJECT_MEMBERS, variables: { project: id } },
      ],
    },
  );
  return { deleteProjectMember, loading, error };
};
