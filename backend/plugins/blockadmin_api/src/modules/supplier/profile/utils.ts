import { FilterQuery } from 'mongoose';
import {
  ISupplierDocument,
  SupplierQueryParams,
} from '@/supplier/profile/@types/supplier';

const addOrFilter = (
  filter: FilterQuery<ISupplierDocument>,
  orCondition: Record<string, any>[],
) => {
  filter.$and = filter.$and || [];
  filter.$and.push({ $or: orCondition });
};

export const generateFilter = (params: SupplierQueryParams) => {
  const {
    searchValue,
    verificationStatus,
    city,
    district,
    dateFilters,
    isFeatured,
  } = params;

  const filter: FilterQuery<ISupplierDocument> = {};

  if (isFeatured) {
    filter.tierLevel = { $gte: 1 };
  }

  if (verificationStatus) {
    filter.verificationStatus = verificationStatus;
  }

  if (searchValue) {
    filter.name = { $regex: searchValue, $options: 'i' };
  }

  if (city) {
    addOrFilter(filter, [
      { 'address.details.city': city },
      { 'address.address.city': city },
    ]);
  }

  if (district) {
    addOrFilter(filter, [
      { 'address.details.city_district': district },
      { 'address.address.city_district': district },
    ]);
  }

  if (dateFilters) {
    let dateFilter: Record<string, any>;
    try {
      dateFilter = JSON.parse(dateFilters);
    } catch {
      throw new Error('Invalid dateFilters: must be valid JSON');
    }

    for (const key in dateFilter) {
      if (!Object.prototype.hasOwnProperty.call(dateFilter, key)) continue;
      const { gte, lte } = dateFilter[key];
      filter[key] = filter[key] || {};
      if (gte) filter[key]['$gte'] = new Date(gte);
      if (lte) filter[key]['$lte'] = new Date(lte);
    }
  }

  return filter;
};
