/**
 * User-selectable capabilities that are independent from erxes operation
 * permissions. Local skills and file reading are governed elsewhere and do
 * not appear in this catalog.
 */
export const ADDITIONAL_TOOL_KEYS = [
  'webSearch',
  'fetchUrl',
  'calculator',
  'renderChart',
  'renderDiagram',
  'generatePdf',
  'generateDocx',
  'generateXlsx',
  'generatePptx',
  'removeImageBackground',
  'runCode',
] as const;

export type AdditionalToolKey = (typeof ADDITIONAL_TOOL_KEYS)[number];

// Enable safe local capabilities for new and legacy agents. Network access
// and code mode remain opt-in.
export const DEFAULT_ADDITIONAL_TOOL_KEYS: AdditionalToolKey[] = [
  'calculator',
  'renderChart',
  'renderDiagram',
  'generatePdf',
  'generateDocx',
  'generateXlsx',
  'generatePptx',
  'removeImageBackground',
];

export const normalizeAdditionalToolKeys = (
  keys: string[] | undefined,
  fallback: readonly AdditionalToolKey[] = DEFAULT_ADDITIONAL_TOOL_KEYS,
): AdditionalToolKey[] => {
  const requested = keys ?? [...fallback];
  const normalized = [...new Set(requested.map((key) => key.trim()))].filter(
    Boolean,
  );
  // Retired keys (e.g. the removed terminal tool) are dropped silently so
  // agents saved with them keep working; the catalog above is the only
  // source of truth for what can run.
  return ADDITIONAL_TOOL_KEYS.filter((key) => normalized.includes(key));
};
