/** Shared helper for multilingual { en, mn } fields. */
export function getLocalizedString(
  localized: { en?: string; mn?: string } | undefined,
  preferredLang?: 'en' | 'mn',
): string {
  if (!localized || typeof localized !== 'object') {
    return '';
  }
  if (preferredLang && localized[preferredLang]) {
    return localized[preferredLang]!;
  }
  if (localized.en) {
    return localized.en;
  }
  if (localized.mn) {
    return localized.mn;
  }
  const values = Object.values(localized);
  const first = values.find((v) => typeof v === 'string' && v.length > 0);
  return first ? (first as string) : '';
}
