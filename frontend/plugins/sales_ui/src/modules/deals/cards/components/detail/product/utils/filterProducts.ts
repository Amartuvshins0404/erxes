import type { ProductFilterState } from '@/deals/actionBar/types/actionBarTypes';
import type { DealProduct } from '@/deals/utils/dealJson';

type FilterableProduct = DealProduct;

export const filterProducts = (
  products: FilterableProduct[],
  filters: ProductFilterState,
) => {
  let result = products;

  if (filters.productSearch) {
    const search = filters.productSearch.toLowerCase();
    result = result.filter((product) =>
      product.name?.toLowerCase().includes(search),
    );
  }

  if (filters.productCategoryIds) {
    result = result.filter((product) =>
      filters.productCategoryIds?.includes(product.categoryId || ''),
    );
  }

  if (filters.productTagIds) {
    result = result.filter((product) =>
      product.tagIds?.some((tag) => filters.productTagIds?.includes(tag)),
    );
  }

  if (filters.productVendorIds?.length) {
    result = result.filter((product) => {
      const vendorId = product.vendor?._id;

      return (
        !!vendorId && filters.productVendorIds?.includes(vendorId) === true
      );
    });
  }

  if (filters.placeEntityIds?.length) {
    const hasPlaceEntityIds = result.some(
      (product) => typeof product.placeEntityId === 'string',
    );

    if (hasPlaceEntityIds) {
      result = result.filter(
        (product) =>
          !!product.placeEntityId &&
          filters.placeEntityIds?.includes(product.placeEntityId) === true,
      );
    }
  }

  if (filters.responsibleEntityIds?.length) {
    const hasResponsibleEntityIds = result.some(
      (product) => typeof product.responsibleEntityId === 'string',
    );

    if (hasResponsibleEntityIds) {
      result = result.filter(
        (product) =>
          !!product.responsibleEntityId &&
          filters.responsibleEntityIds?.includes(
            product.responsibleEntityId,
          ) === true,
      );
    }
  }

  return result;
};
