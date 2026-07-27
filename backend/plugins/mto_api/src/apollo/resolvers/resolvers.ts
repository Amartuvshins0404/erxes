import providerCustomResolvers from '@/provider/graphql/resolvers/customResolvers/provider';
import { categoryCustomResolvers } from '@/category/graphql/resolvers/customResolvers/category';
import eventCustomResolvers from '@/event/graphql/resolvers/customResolvers/event';
import registrationApplicationCustomResolvers from '@/registration/graphql/resolvers/customResolvers/registrationApplication';

export const customResolvers = {
  ...providerCustomResolvers,
  ...categoryCustomResolvers,
  ...eventCustomResolvers,
  ...registrationApplicationCustomResolvers,
};
