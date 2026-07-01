import { useMutation, useQuery } from '@apollo/client';
import { MASTRA_VOICE_CONFIG, MASTRA_VOICE_CATALOG } from '~/graphql/queries';
import { MASTRA_VOICE_CONFIG_SAVE } from '~/graphql/mutations';
import { toastError } from '~/lib/mutationToast';
import { IVoiceCatalogResponse, IVoiceConfigResponse } from '../types';

/** Tenant Chimege voice (BYOK) status, the voice catalog, and the save mutation. */
export const useVoiceSettings = () => {
  const { data: configData, refetch } =
    useQuery<IVoiceConfigResponse>(MASTRA_VOICE_CONFIG);
  const { data: catalogData } =
    useQuery<IVoiceCatalogResponse>(MASTRA_VOICE_CATALOG);

  const [save, { loading: saving }] = useMutation(MASTRA_VOICE_CONFIG_SAVE, {
    onCompleted: () => refetch(),
    onError: toastError(),
  });

  return {
    config: configData?.mastraVoiceConfig ?? null,
    voices: catalogData?.mastraVoiceCatalog ?? [],
    save,
    saving,
  };
};
