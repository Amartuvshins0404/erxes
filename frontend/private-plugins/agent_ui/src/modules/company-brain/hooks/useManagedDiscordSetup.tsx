import { useLazyQuery, useMutation, useQuery } from '@apollo/client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AGENT_DISCORD_BINDINGS,
  AGENT_DISCORD_CHANNELS,
  AGENT_DISCORD_CONNECT_URL,
  AGENT_DISCORD_CREATE_BINDING,
  AGENT_DISCORD_DELETE_BINDING,
  AGENT_DISCORD_INSTALLATIONS,
  AGENT_DISCORD_UPDATE_BINDING,
} from '../graphql/managedDiscord';

export const DISCORD_RATE_LIMIT_MESSAGE =
  'Discord is rate limiting requests. Please wait a moment and try again.';

const CHANNEL_LOAD_DEBOUNCE_MS = 300;
const MANUAL_REFRESH_THROTTLE_MS = 1_500;

export const getManagedDiscordErrorMessage = (error: unknown) => {
  if (!error) {
    return '';
  }

  const anyError = error as {
    message?: string;
    graphQLErrors?: Array<{
      message?: string;
      extensions?: Record<string, unknown>;
    }>;
    networkError?: {
      statusCode?: number;
      message?: string;
      result?: { error?: string; details?: Record<string, unknown> };
    };
  };

  const graphQlRateLimit = anyError.graphQLErrors?.some((graphQLError) => {
    const extensions = graphQLError.extensions || {};

    return (
      extensions.code === 'DISCORD_RATE_LIMITED' ||
      extensions.statusCode === 429 ||
      graphQLError.message?.includes('status 429') ||
      graphQLError.message === DISCORD_RATE_LIMIT_MESSAGE
    );
  });

  if (
    graphQlRateLimit ||
    anyError.networkError?.statusCode === 429 ||
    anyError.networkError?.result?.details?.code === 'DISCORD_RATE_LIMITED' ||
    anyError.message?.includes('status 429') ||
    anyError.message?.includes('DISCORD_RATE_LIMITED') ||
    anyError.message === DISCORD_RATE_LIMIT_MESSAGE
  ) {
    return DISCORD_RATE_LIMIT_MESSAGE;
  }

  return anyError.message || String(error);
};

const parseRetryAfter = (value: unknown) => {
  const parsed = typeof value === 'number' ? value : Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

export const getManagedDiscordRetryAfter = (error: unknown) => {
  if (!error) {
    return undefined;
  }

  const anyError = error as {
    graphQLErrors?: Array<{
      extensions?: Record<string, unknown>;
    }>;
    networkError?: {
      result?: { details?: Record<string, unknown> };
    };
  };

  for (const graphQLError of anyError.graphQLErrors || []) {
    const retryAfter = parseRetryAfter(graphQLError.extensions?.retryAfter);

    if (retryAfter !== undefined) {
      return retryAfter;
    }
  }

  return parseRetryAfter(anyError.networkError?.result?.details?.retryAfter);
};

export type DiscordInstallation = {
  _id: string;
  tenantId: string;
  assistantId?: string;
  discordGuildId: string;
  discordGuildName?: string;
  status: 'connected' | 'disabled' | 'revoked';
};

export type DiscordChannel = {
  id: string;
  name: string;
  type: number;
  position?: number;
  parentId?: string;
};

export type DiscordAssistantBinding = {
  _id: string;
  tenantId: string;
  assistantId: string;
  assistantName?: string;
  discordGuildId: string;
  discordChannelId: string;
  enabled: boolean;
  responseMode?: 'slash_only' | 'all_messages';
};

type ManagedDiscordSetupOptions = {
  assistantId?: string;
  runtimeUrl?: string;
  runtimeStatus?: string;
  mode?: 'create' | 'manage';
  enabled?: boolean;
};

export const useManagedDiscordSetup = (
  input?: string | ManagedDiscordSetupOptions,
) => {
  const enabled = typeof input === 'string' ? true : input?.enabled ?? true;
  const assistantId =
    enabled === false
      ? undefined
      : typeof input === 'string'
      ? input
      : input?.assistantId;
  const runtimeUrl = typeof input === 'string' ? undefined : input?.runtimeUrl;
  const runtimeStatus =
    typeof input === 'string' ? undefined : input?.runtimeStatus;
  const mode = typeof input === 'string' ? 'create' : input?.mode || 'create';
  const [selectedInstallationId, setSelectedInstallationId] = useState('');
  const [debouncedInstallationId, setDebouncedInstallationId] = useState('');
  const [selectedChannelId, setSelectedChannelId] = useState('');
  const [localError, setLocalError] = useState('');
  const [refreshingDiscord, setRefreshingDiscord] = useState(false);
  const [rateLimitedUntil, setRateLimitedUntil] = useState(0);
  const lastManualRefreshAt = useRef(0);
  const refreshPromiseRef = useRef<Promise<void> | null>(null);
  const actionPromisesRef = useRef<Record<string, Promise<unknown> | null>>({});

  const runSingle = useCallback(
    async <T,>(key: string, action: () => Promise<T>) => {
      if (rateLimitedUntil > Date.now()) {
        throw new Error(DISCORD_RATE_LIMIT_MESSAGE);
      }

      const active = actionPromisesRef.current[key];

      if (active) {
        return active as Promise<T>;
      }

      const promise = action()
        .catch((error) => {
          const message = getManagedDiscordErrorMessage(error);
          const retryAfter = getManagedDiscordRetryAfter(error);

          setLocalError(message);

          if (retryAfter) {
            setRateLimitedUntil(Date.now() + retryAfter * 1000);
          }

          throw new Error(message);
        })
        .finally(() => {
          actionPromisesRef.current[key] = null;
        });

      actionPromisesRef.current[key] = promise;

      return promise;
    },
    [rateLimitedUntil],
  );

  useEffect(() => {
    setSelectedInstallationId('');
    setDebouncedInstallationId('');
    setSelectedChannelId('');
    setLocalError('');
    setRateLimitedUntil(0);
  }, [assistantId]);

  useEffect(() => {
    if (rateLimitedUntil <= Date.now()) {
      return;
    }

    const timer = window.setTimeout(() => {
      setRateLimitedUntil(0);
    }, rateLimitedUntil - Date.now());

    return () => window.clearTimeout(timer);
  }, [rateLimitedUntil]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedInstallationId(selectedInstallationId);
    }, CHANNEL_LOAD_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [selectedInstallationId]);

  const {
    data: installationsData,
    loading: loadingInstallations,
    error: installationsError,
    refetch: refetchInstallations,
  } = useQuery(AGENT_DISCORD_INSTALLATIONS, {
    variables: { assistantId },
    skip: !assistantId,
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
    errorPolicy: 'all',
    notifyOnNetworkStatusChange: true,
  });

  const {
    data: bindingsData,
    loading: loadingBindings,
    error: bindingsError,
    refetch: refetchBindings,
  } = useQuery(AGENT_DISCORD_BINDINGS, {
    variables: { assistantId },
    skip: !assistantId,
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
    notifyOnNetworkStatusChange: true,
  });

  const installations = useMemo<DiscordInstallation[]>(
    () => installationsData?.agentDiscordInstallations || [],
    [installationsData],
  );

  const bindings = useMemo<DiscordAssistantBinding[]>(
    () => bindingsData?.agentDiscordBindings || [],
    [bindingsData],
  );

  const activeBinding = useMemo(
    () => bindings.find((binding) => binding.enabled),
    [bindings],
  );

  useEffect(() => {
    if (!installations.length || selectedInstallationId) {
      return;
    }

    const activeInstallation = activeBinding
      ? installations.find(
          (installation) =>
            installation.discordGuildId === activeBinding.discordGuildId,
        )
      : undefined;

    setSelectedInstallationId(activeInstallation?._id || installations[0]._id);
  }, [activeBinding, installations, selectedInstallationId]);

  const {
    data: channelsData,
    loading: loadingChannels,
    error: channelsError,
    refetch: refetchChannels,
  } = useQuery(AGENT_DISCORD_CHANNELS, {
    variables: { assistantId, installationId: debouncedInstallationId },
    skip: !assistantId || !debouncedInstallationId,
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
    errorPolicy: 'all',
    notifyOnNetworkStatusChange: true,
  });

  const channels = useMemo<DiscordChannel[]>(
    () => channelsData?.agentDiscordChannels || [],
    [channelsData],
  );

  useEffect(() => {
    if (!activeBinding || selectedChannelId) {
      return;
    }

    setSelectedChannelId(activeBinding.discordChannelId);
  }, [activeBinding, selectedChannelId]);

  const [loadConnectUrl, { loading: loadingConnectUrl }] = useLazyQuery(
    AGENT_DISCORD_CONNECT_URL,
    { fetchPolicy: 'no-cache' },
  );

  const [createBinding, { loading: creatingBinding }] = useMutation(
    AGENT_DISCORD_CREATE_BINDING,
  );

  const [deleteBinding, { loading: deletingBinding }] = useMutation(
    AGENT_DISCORD_DELETE_BINDING,
  );

  const [updateBinding, { loading: updatingBinding }] = useMutation(
    AGENT_DISCORD_UPDATE_BINDING,
  );

  const connectDiscord = useCallback(
    async (returnUrl: string) =>
    runSingle('connectDiscord', async () => {
      if (!assistantId) {
        throw new Error('assistantId is required');
      }

      setLocalError('');
      const response = await loadConnectUrl({
        variables: { assistantId, returnUrl },
      });
      const url = response.data?.agentDiscordConnectUrl;

      if (!url) {
        throw new Error('Could not generate Discord connect URL');
      }

      window.location.href = url;
    }),
    [assistantId, loadConnectUrl, runSingle],
  );

  const connectChannel = useCallback(
    async () =>
    runSingle('connectChannel', async () => {
      if (!assistantId || !selectedInstallationId || !selectedChannelId) {
        throw new Error('Select a Discord server and channel');
      }

      setLocalError('');
      await createBinding({
        variables: {
          assistantId,
          installationId: selectedInstallationId,
          discordChannelId: selectedChannelId,
        },
      });

      await refetchBindings();
    }),
    [
      assistantId,
      createBinding,
      refetchBindings,
      runSingle,
      selectedChannelId,
      selectedInstallationId,
    ],
  );

  const disconnectChannel = useCallback(
    async (bindingId: string) =>
    runSingle(`disconnectChannel:${bindingId}`, async () => {
      if (!assistantId) {
        throw new Error('assistantId is required');
      }

      setLocalError('');
      await deleteBinding({
        variables: { assistantId, bindingId },
      });

      setSelectedChannelId('');
      await refetchBindings();
    }),
    [assistantId, deleteBinding, refetchBindings, runSingle],
  );

  const updateBindingResponseMode = useCallback(
    async (
      bindingId: string,
      responseMode: 'slash_only' | 'all_messages',
    ) =>
    runSingle(`updateBinding:${bindingId}`, async () => {
      if (!assistantId) {
        throw new Error('assistantId is required');
      }

      setLocalError('');
      await updateBinding({
        variables: {
          assistantId,
          bindingId,
          input: { responseMode },
        },
      });

      await refetchBindings();
    }),
    [assistantId, refetchBindings, runSingle, updateBinding],
  );

  const refresh = useCallback(async () => {
    if (rateLimitedUntil > Date.now()) {
      setLocalError(DISCORD_RATE_LIMIT_MESSAGE);
      return Promise.resolve();
    }

    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    const now = Date.now();

    if (now - lastManualRefreshAt.current < MANUAL_REFRESH_THROTTLE_MS) {
      return Promise.resolve();
    }

    lastManualRefreshAt.current = now;
    setRefreshingDiscord(true);
    setLocalError('');

    const promise = Promise.all([
      refetchInstallations(),
      refetchBindings(),
      debouncedInstallationId ? refetchChannels() : Promise.resolve(),
    ])
      .then(() => undefined)
      .catch((error) => {
        const message = getManagedDiscordErrorMessage(error);
        const retryAfter = getManagedDiscordRetryAfter(error);

        setLocalError(message);

        if (retryAfter) {
          setRateLimitedUntil(Date.now() + retryAfter * 1000);
        }

        return undefined;
      })
      .finally(() => {
        refreshPromiseRef.current = null;
        setRefreshingDiscord(false);
      });

    refreshPromiseRef.current = promise;

    return promise;
  }, [
    debouncedInstallationId,
    rateLimitedUntil,
    refetchBindings,
    refetchChannels,
    refetchInstallations,
  ]);

  const normalizedQueryError = getManagedDiscordErrorMessage(
    installationsError || bindingsError || channelsError,
  );
  const errorMessage = localError || normalizedQueryError;
  const queryRetryAfter = getManagedDiscordRetryAfter(
    installationsError || bindingsError || channelsError,
  );
  const rateLimited = rateLimitedUntil > Date.now();

  useEffect(() => {
    if (queryRetryAfter) {
      setRateLimitedUntil(Date.now() + queryRetryAfter * 1000);
    }
  }, [queryRetryAfter]);

  return {
    activeBinding,
    bindings,
    channels,
    connectChannel,
    connectDiscord,
    disconnectChannel,
    updateBindingResponseMode,
    error: errorMessage ? { message: errorMessage } : undefined,
    installations,
    loadingBindings,
    loadingChannels,
    loadingConnectUrl,
    loadingInstallations,
    loading:
      loadingInstallations ||
      loadingBindings ||
      loadingChannels ||
      loadingConnectUrl ||
      refreshingDiscord ||
      rateLimited,
    mode,
    runtimeStatus,
    runtimeUrl,
    refresh,
    saving: creatingBinding || deletingBinding || updatingBinding,
    creatingBinding,
    deletingBinding,
    refreshingDiscord,
    rateLimited,
    updatingBinding,
    selectedChannelId,
    selectedInstallationId,
    setSelectedChannelId,
    setSelectedInstallationId,
  };
};
