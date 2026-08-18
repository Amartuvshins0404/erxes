import { useMutation, useQuery } from '@apollo/client';
import { BA_ASSIGN_PRODUCT_CATEGORY } from '../graphql/mutations';
import { BA_PRODUCT_CATEGORIES } from '../graphql/queries';
import { IBaProductCategory } from '../types';

export const useCoreProductCategories = (searchValue?: string) => {
  const { data, loading } = useQuery<{
    productCategories: IBaProductCategory[];
  }>(BA_PRODUCT_CATEGORIES, {
    variables: { searchValue },
  });

  const categories = data?.productCategories || [];

  return { categories, loading };
};

export const useAssignProductCategory = () => {
  const [assign, { loading }] = useMutation(BA_ASSIGN_PRODUCT_CATEGORY, {
    refetchQueries: ['BaProducts', 'BaProductDetail'],
  });

  return { assign, loading };
};
