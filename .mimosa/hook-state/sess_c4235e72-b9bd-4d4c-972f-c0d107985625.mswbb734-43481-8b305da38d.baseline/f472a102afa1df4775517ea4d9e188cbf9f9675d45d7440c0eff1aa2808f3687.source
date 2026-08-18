import { useQuery } from '@apollo/client';
import { MUSHOP_SUPPLIER_DETAIL } from '../graphql/supplierDetail';
import { ISupplier } from '../types';

export const useSupplierDetail = (_id?: string | null) => {
  const { data, loading } = useQuery<{ mushopSupplierDetail: ISupplier }>(
    MUSHOP_SUPPLIER_DETAIL,
    { variables: { _id }, skip: !_id },
  );

  return { supplier: data?.mushopSupplierDetail ?? null, loading };
};
