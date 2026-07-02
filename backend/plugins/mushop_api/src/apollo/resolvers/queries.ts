import supplierQueries from '@/supplier/graphql/resolvers/queries';
import productQueries from '@/product/graphql/resolvers/queries';
import { productSpecificationQueries } from '@/product-specification/graphql/resolvers/queries/productSpecification';
import { configQueries } from '@/config/graphql/resolvers/queries/config';
import { membershipQueries } from '@/membership/graphql/resolvers/queries/mushopMembership';
import { membershipPlanQueries } from '@/membership/graphql/resolvers/queries/mushopMembershipPlan';
import { mushopInvoiceQueries } from '@/membership/graphql/resolvers/queries/invoices';
import collectiveQueries from '@/collective/graphql/resolvers/queries';
import collectivePackageQueries from '@/collective-package/graphql/resolvers/queries';

export const queries = {
  ...supplierQueries,
  ...productQueries,
  ...productSpecificationQueries,
  ...configQueries,
  ...membershipQueries,
  ...membershipPlanQueries,
  ...mushopInvoiceQueries,
  ...collectiveQueries,
  ...collectivePackageQueries,
};
