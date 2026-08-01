import { useMutation, useQuery } from '@apollo/client';
import { MASTRA_SETTINGS } from '~/graphql/queries';
import { MASTRA_SETTINGS_SAVE } from '~/graphql/mutations';
import { toastError } from '~/lib/mutationToast';
import { ISettingsResponse } from '../types';

/** Settings document and save mutation. */
export const useGeneralSettings = () => {
  const { data: settingsData } = useQuery<ISettingsResponse>(MASTRA_SETTINGS);
  const [save, { loading: saving }] = useMutation(MASTRA_SETTINGS_SAVE, {
    refetchQueries: [{ query: MASTRA_SETTINGS }],
    onError: toastError(),
  });

  return {
    settings: settingsData?.mastraSettings ?? null,
    save,
    saving,
  };
};
