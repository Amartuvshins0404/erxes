import { useMutation } from '@apollo/client';
import { CREATE_NEWS } from '../graphql/newsMutations';

export const useCreateNews = () => {
  const [createNews, { loading }] = useMutation(CREATE_NEWS, {
    refetchQueries: ['BtkGetAllNews'],
  });

  return {
    createNews: createNews,
    loading,
  };
};
