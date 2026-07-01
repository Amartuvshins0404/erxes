import { apolloCustomScalars } from 'erxes-api-shared/utils';
import { MushopSupplier } from '@/supplier/graphql/resolvers/customResolvers/supplier';
import { MushopProduct } from '@/product/graphql/resolvers/customResolvers/mushopProduct';
import {
  MushopCollective,
  MushopCollectiveSyncResult,
} from '@/collective/graphql/resolvers/customResolvers/collective';
import { MushopCollectivePackage } from '@/collective-package/graphql/resolvers/customResolvers/collectivePackage';
import { mutations } from './mutations';
import { queries } from './queries';
import { membershipTypeResolvers } from '@/membership/graphql/resolvers/queries/mushopMembership';
import { extensionResolvers } from './extensions';

const resolvers: any = {
  Mutation: {
    ...mutations,
  },
  Query: {
    ...queries,
  },
  MushopSupplier,
  MushopProduct,
  MushopCollective,
  MushopCollectiveSyncResult,
  MushopCollectivePackage,
  ...membershipTypeResolvers,
  ...apolloCustomScalars,
  ...extensionResolvers,
};

export default resolvers;
