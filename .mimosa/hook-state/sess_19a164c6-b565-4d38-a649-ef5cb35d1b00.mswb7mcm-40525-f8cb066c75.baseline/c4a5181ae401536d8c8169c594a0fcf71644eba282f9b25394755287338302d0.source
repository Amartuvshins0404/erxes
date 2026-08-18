import {
  OneFitMultilingualString,
  OneFitMultilingualStringOptional,
} from '../types/category';

/**
 * Get localized string with fallback logic
 * Priority: preferredLang → 'en' → 'mn' → first available → empty string
 */
export function getLocalizedString(
  localized:
    | OneFitMultilingualString
    | OneFitMultilingualStringOptional
    | undefined,
  preferredLang?: 'en' | 'mn',
): string {
  if (!localized || typeof localized !== 'object') {
    return '';
  }

  // Try preferred language first
  if (preferredLang && localized[preferredLang]) {
    return localized[preferredLang]!;
  }

  // Fallback to English
  if (localized.en) {
    return localized.en;
  }

  // Fallback to Mongolian
  if (localized.mn) {
    return localized.mn;
  }

  // Fallback to first available
  const values = Object.values(localized);
  const firstValue = values.find((v) => typeof v === 'string' && v.length > 0);
  if (firstValue) {
    return firstValue as string;
  }

  return '';
}
