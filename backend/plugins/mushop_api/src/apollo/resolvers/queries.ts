import supplierQueries from '@/supplier/graphql/resolvers/queries';
import productQueries from '@/product/graphql/resolvers/queries';
import { subscriptionQueries } from '@/subscription/graphql/resolvers/queries/mushopSubscription';
import { subscriptionPlanQueries } from '@/subscription/graphql/resolvers/queries/mushopSubscriptionPlan';
import { mushopInvoiceQueries } from '@/subscription/graphql/resolvers/queries/invoices';
import collectiveQueries from '@/collective/graphql/resolvers/queries';
import collectivePackageQueries from '@/collective-package/graphql/resolvers/queries';

export const queries = {
  ...supplierQueries,
  ...productQueries,
  ...subscriptionQueries,
  ...subscriptionPlanQueries,
  ...mushopInvoiceQueries,
  ...collectiveQueries,
  ...collectivePackageQueries,
};
