import { cpSupplierQueries } from './clientPortal';
import { supplierQueries } from './supplier';
import { orderQueries } from './order';

export default {
  ...supplierQueries,
  ...cpSupplierQueries,
  ...orderQueries,
};
