import {
  IMastraSettings,
  IMastraSettingsDocument,
} from '@/settings/@types/settings';

export interface PublicMastraSettings
  extends Omit<IMastraSettings, 'erxesApiToken'> {
  _id?: string;
  hasErxesApiToken: boolean;
}

export const toPublicSettings = (
  settings: IMastraSettings | IMastraSettingsDocument,
): PublicMastraSettings => {
  const value =
    'toObject' in settings ? settings.toObject<IMastraSettings>() : settings;
  const { erxesApiToken, ...publicSettings } = value;

  return {
    ...publicSettings,
    hasErxesApiToken: Boolean(erxesApiToken),
  };
};
