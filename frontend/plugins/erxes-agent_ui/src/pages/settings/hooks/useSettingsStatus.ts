import { useQuery } from '@apollo/client';
import {
  MASTRA_ATTACHMENT_STORAGE_STATUS,
  MASTRA_VOICE_STATUS,
} from '~/graphql/queries';
import type {
  IAttachmentStorageStatusResponse,
  IVoiceStatusResponse,
} from '../types';

/** Secret-free feature readiness for users with settings.statusRead. */
export const useSettingsStatus = () => {
  const {
    data: attachmentData,
    loading: attachmentLoading,
    error: attachmentError,
  } = useQuery<IAttachmentStorageStatusResponse>(
    MASTRA_ATTACHMENT_STORAGE_STATUS,
  );
  const {
    data: voiceData,
    loading: voiceLoading,
    error: voiceError,
  } = useQuery<IVoiceStatusResponse>(MASTRA_VOICE_STATUS);

  return {
    attachmentStorage: attachmentData?.mastraAttachmentStorageStatus ?? null,
    voiceStatus: voiceData?.mastraVoiceStatus ?? null,
    loading: attachmentLoading || voiceLoading,
    error: attachmentError ?? voiceError,
  };
};
