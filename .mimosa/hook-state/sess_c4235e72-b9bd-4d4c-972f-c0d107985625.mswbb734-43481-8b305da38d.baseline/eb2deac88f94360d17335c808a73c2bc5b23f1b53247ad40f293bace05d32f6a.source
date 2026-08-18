import { useMutation } from '@apollo/client';
import { CREATE_NEWS } from '../graphql/newsMutations';

export const useCreateNews = () => {
  const [createNews, { loading }] = useMutation(CREATE_NEWS, {
    refetchQueries: ['BtkAdminGetAllNews'],
  });

  return {
    createNews: createNews,
    loading,
  };
};
