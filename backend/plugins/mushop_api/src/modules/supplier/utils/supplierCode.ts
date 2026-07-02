import { LOCATION_ZIP } from '@/supplier/utils/locationZip';

const TRANSLIT: Array<[RegExp, string]> = [
  [/Ё/g, 'YO'],
  [/Й/g, 'I'],
  [/Ц/g, 'TS'],
  [/У/g, 'U'],
  [/Ү/g, 'U'],
  [/Е/g, 'E'],
  [/Н/g, 'N'],
  [/Г/g, 'G'],
  [/Ш/g, 'SH'],
  [/Щ/g, 'SH'],
  [/З/g, 'Z'],
  [/Х/g, 'KH'],
  [/Ъ/g, ''],
  [/Ф/g, 'F'],
  [/Ы/g, 'Y'],
  [/В/g, 'V'],
  [/А/g, 'A'],
  [/П/g, 'P'],
  [/Р/g, 'R'],
  [/О/g, 'O'],
  [/Ө/g, 'O'],
  [/Л/g, 'L'],
  [/Д/g, 'D'],
  [/Ж/g, 'J'],
  [/Э/g, 'E'],
  [/Я/g, 'YA'],
  [/Ч/g, 'CH'],
  [/С/g, 'S'],
  [/М/g, 'M'],
  [/И/g, 'I'],
  [/Т/g, 'T'],
  [/Ь/g, ''],
  [/Б/g, 'B'],
  [/Ю/g, 'YU'],
  [/К/g, 'K'],
];

const transliterate = (input: string): string => {
  let out = input.toUpperCase();
  for (const [re, rep] of TRANSLIT) out = out.replace(re, rep);
  return out.replace(/[^A-Z0-9]/g, '');
};

const DISTRICT_SHORT: Record<string, string> = {
  'Багануур дүүрэг': 'BND',
  'Багахангай дүүрэг': 'BHD',
  'Налайх дүүрэг': 'NLD',
  'Баянзүрх дүүрэг': 'BZD',
  'Сүхбаатар дүүрэг': 'SBD',
  'Чингэлтэй дүүрэг': 'CHD',
  'Баянгол дүүрэг': 'BGD',
  'Хан-Уул дүүрэг': 'KHUD',
  'Сонгинохайрхан дүүрэг': 'SHD',
};

export const cityCode = (city?: string): string => {
  const trimmed = (city || '').trim();
  if (!trimmed) return 'XX';
  if (trimmed === 'Улаанбаатар') return 'UB';
  const ascii = transliterate(trimmed);
  return ascii.slice(0, 2) || 'XX';
};

export const districtCode = (district?: string): string => {
  const trimmed = (district || '').trim();
  if (!trimmed) return 'XX';

  if (DISTRICT_SHORT[trimmed]) return DISTRICT_SHORT[trimmed];

  const words = trimmed
    .replace(/(дүүрэг|сум)/gi, '')
    .split(/[\s-]+/)
    .map((w) => w.trim())
    .filter(Boolean);

  if (!words.length) return 'XX';

  const initials = words
    .map((w) => transliterate(w).slice(0, w.length > 6 ? 3 : 2))
    .join('')
    .slice(0, 4);

  return initials || 'XX';
};

export const locationCode = (city?: string, district?: string): string => {
  const zip = LOCATION_ZIP[(city || '').trim()]?.[(district || '').trim()];
  if (zip) return zip;
  return `${cityCode(city)}${districtCode(district)}`;
};
