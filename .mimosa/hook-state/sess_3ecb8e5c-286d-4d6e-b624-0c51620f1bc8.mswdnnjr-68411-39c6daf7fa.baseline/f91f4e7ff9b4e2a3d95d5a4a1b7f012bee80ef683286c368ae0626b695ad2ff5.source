import { useQuery } from '@apollo/client';
import { BA_SUPPLIER_DETAIL } from '../graphql/queries';
import { ISupplier } from '../types';

export const useSupplierDetail = (_id?: string | null) => {
  const { data, loading } = useQuery<{ baSupplierDetail: ISupplier }>(
    BA_SUPPLIER_DETAIL,
    { variables: { _id }, skip: !_id },
  );

  return { supplier: data?.baSupplierDetail ?? null, loading };
};
