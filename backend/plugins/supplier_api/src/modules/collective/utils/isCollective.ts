import { getEnv, getSaasOrganizationDetail } from 'erxes-api-shared/utils';

export const isValid = async (
  subdomain: string,
  bundleType: string,
): Promise<boolean> => {
  const bundle = getEnv({ name: bundleType });

  const organization = (await getSaasOrganizationDetail({ subdomain })) as
    | { bundle?: { type?: string } }
    | undefined;

  return organization?.bundle?.type === bundle;
};

type ResolverFn = (root: any, args: any, context: any, info: any) => any;

const guardResolvers = <T extends Record<string, ResolverFn>>(
  resolvers: T,
  predicate: (subdomain: string) => Promise<boolean>,
  errorMessage: string,
): T => {
  const guarded: Record<string, ResolverFn> = {};

  for (const [name, resolver] of Object.entries(resolvers)) {
    const guardedResolver: ResolverFn = async (root, args, context, info) => {
      const allowed = await predicate(context.subdomain);
      if (!allowed) {
        throw new Error(errorMessage);
      }
      return resolver(root, args, context, info);
    };

    Object.assign(guardedResolver, resolver);

    guarded[name] = guardedResolver;
  }

  return guarded as T;
};

export const collectiveOnly = <T extends Record<string, ResolverFn>>(
  resolvers: T,
): T =>
  guardResolvers(
    resolvers,
    async (subdomain) => await isValid(subdomain, 'COLLECTIVE_BUNDLE_TYPE'),
    'This operation is only available for collective organizations',
  );

export const supplierOnly = <T extends Record<string, ResolverFn>>(
  resolvers: T,
): T =>
  guardResolvers(
    resolvers,
    async (subdomain) => await isValid(subdomain, 'SUPPLIER_BUNDLE_TYPE'),
    'This operation is only available for supplier organizations',
  );
