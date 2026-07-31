import { useMutation, useQuery } from '@apollo/client';
import { toast } from 'erxes-ui';
import {
  MASTRA_PROVIDERS,
  MASTRA_PROVIDER_PRESETS,
  MASTRA_PROVIDER_CATALOG,
} from '~/graphql/queries';
import {
  MASTRA_PROVIDER_SAVE,
  MASTRA_PROVIDER_REMOVE,
} from '~/graphql/mutations';
import { toastError } from '~/lib/mutationToast';
import {
  IProviderCatalogResponse,
  IProviderPresetsResponse,
  IProvidersResponse,
  MastraProviderScope,
} from '../types';
import { usePermissionCheck } from 'ui-modules';
import { ERXES_AGENT_ACTIONS } from '~/permissions';

/** Provider list/presets/catalog plus save & remove mutations for the page. */
export const useProviders = (
  onSaved: () => void,
  scope: MastraProviderScope,
) => {
  const { hasActionPermission, isLoaded } = usePermissionCheck();
  const canReadConfig =
    isLoaded && hasActionPermission(ERXES_AGENT_ACTIONS.provider.configRead);
  const canReadCatalog =
    isLoaded && hasActionPermission(ERXES_AGENT_ACTIONS.provider.catalogRead);
  const { data: providersData, refetch } = useQuery<IProvidersResponse>(
    MASTRA_PROVIDERS,
    { variables: { scope }, skip: !canReadConfig },
  );
  const { data: presetsData } = useQuery<IProviderPresetsResponse>(
    MASTRA_PROVIDER_PRESETS,
    { skip: !canReadCatalog },
  );
  const { data: catalogData, refetch: refetchCatalog } =
    useQuery<IProviderCatalogResponse>(MASTRA_PROVIDER_CATALOG, {
      skip: !canReadCatalog,
    });

  const [saveProvider, { loading: saving }] = useMutation(
    MASTRA_PROVIDER_SAVE,
    {
      onCompleted: () => {
        if (canReadConfig) void refetch();
        if (canReadCatalog) void refetchCatalog();
        onSaved();
        toast({ title: 'Provider saved' });
      },
      onError: toastError(),
    },
  );
  const [removeProvider] = useMutation(MASTRA_PROVIDER_REMOVE, {
    onCompleted: () => {
      if (canReadConfig) void refetch();
      if (canReadCatalog) void refetchCatalog();
    },
    onError: toastError(),
  });

  const providers = providersData?.mastraProviders ?? [];
  const presets = presetsData?.mastraProviderPresets ?? [];
  // Maps provider key → isConfigured (covers both DB docs and env-var-only providers)
  const catalogMap = new Map<string, boolean>(
    (catalogData?.mastraProviderCatalog ?? []).map((p) => [
      p.provider,
      Boolean(p.isConfigured),
    ]),
  );

  return {
    providers,
    presets,
    catalogMap,
    saveProvider,
    removeProvider,
    saving,
  };
};
