import { useMutation } from '@apollo/client';
import { toast } from 'erxes-ui';
import { useNavigate } from 'react-router-dom';
import { BLOCK_ADMIN_REMOVE_LISTING, GET_ADMIN_LISTINGS } from '../graphql';

export const useAdminRemoveListing = () => {
  const navigate = useNavigate();

  const [removeMutation, { loading }] = useMutation(
    BLOCK_ADMIN_REMOVE_LISTING,
    {
      refetchQueries: [{ query: GET_ADMIN_LISTINGS }],
      onCompleted: () => {
        toast({
          title: 'Success',
          description: 'Listing removed successfully',
        });
        navigate('/blockadmin/agencies/listing');
      },
      onError: (error) => {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      },
    },
  );

  const removeListing = (_id: string) => {
    return removeMutation({ variables: { _id } });
  };

  return { removeListing, loading };
};
