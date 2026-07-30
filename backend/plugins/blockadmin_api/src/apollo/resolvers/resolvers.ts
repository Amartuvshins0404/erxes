import cpCustomResolvers from '@/clientportal/graphql/resolvers/customResolvers';
import developerCustomResolvers from '@/developer/graphql/resolvers/customResolvers';
import formCustomResolvers from '@/form/graphql/customResolver';
import projectCustomResolvers from '@/project/graphql/resolvers/customResolvers';
import unitCustomResolvers from '@/unit/graphql/resolvers/customResolvers';
import { BaSupplier } from '@/supplier/profile/graphql/resolvers/customResolvers/supplier';
import { BaProduct } from '@/supplier/product/graphql/resolvers/customResolvers/product';
import { membershipTypeResolvers } from '@/membership/graphql/resolvers/queries/membership';
import CPUser from '@/membership/graphql/resolvers/customResolvers/cpUser';

export const customResolvers = {
  ...unitCustomResolvers,
  ...projectCustomResolvers,
  ...formCustomResolvers,
  ...developerCustomResolvers,

  BaSupplier,
  BaProduct,
  ...membershipTypeResolvers,
  CPUser,

  ...cpCustomResolvers,
};
