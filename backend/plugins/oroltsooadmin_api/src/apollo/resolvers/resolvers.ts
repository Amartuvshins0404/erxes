import { cpCustomResolvers } from '@/clientportal/graphql/resolvers/customResolvers';
import {
  OroltsooAdminProfile,
  OroltsooAdminProfileFinance,
} from '@/profile/graphql/resolvers/customResolvers/profile';

export const customResolvers = {
  OroltsooAdminProfile,
  OroltsooAdminProfileFinance,

  ...cpCustomResolvers,
};
