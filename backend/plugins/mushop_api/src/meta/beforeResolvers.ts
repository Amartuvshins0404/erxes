import {
  BeforeResolverParams,
  BeforeResolverResult,
  BeforeResolversConfig,
} from 'erxes-api-shared/utils';
import { productBeforeResolvers } from '@/product/beforeResolvers';
import { supplierBeforeResolvers } from '@/supplier/beforeResolvers';

const configs: BeforeResolversConfig[] = [
  productBeforeResolvers,
  supplierBeforeResolvers,
];

const handlesResolver = (
  config: BeforeResolversConfig,
  resolver: string,
): boolean =>
  Object.values(config.resolvers).some((names) => names.includes(resolver));

const mergeResolvers = (): Record<string, string[]> => {
  const merged: Record<string, string[]> = {};

  for (const config of configs) {
    for (const [moduleName, names] of Object.entries(config.resolvers)) {
      merged[moduleName] = Array.from(
        new Set([...(merged[moduleName] ?? []), ...names]),
      );
    }
  }

  return merged;
};

const beforeResolvers: BeforeResolversConfig = {
  resolvers: mergeResolvers(),
  handler: async (
    subdomain: string,
    params: BeforeResolverParams,
  ): Promise<BeforeResolverResult> => {
    for (const config of configs) {
      if (handlesResolver(config, params.resolver)) {
        return config.handler(subdomain, params);
      }
    }

    return params.args;
  },
};

export default beforeResolvers;
