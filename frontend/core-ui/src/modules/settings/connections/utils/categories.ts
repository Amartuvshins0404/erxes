import type { TFunction } from 'i18next';

const CATEGORY_LABELS: Record<string, [string, string]> = {
  ai: ['category-ai', 'AI'],
};

export const getCategoryLabel = (category: string, t: TFunction): string => {
  const known = CATEGORY_LABELS[category];

  if (known) {
    return t(known[0], known[1]);
  }

  return category.charAt(0).toUpperCase() + category.slice(1);
};
