import { ExpectedError } from 'erxes-api-shared/utils';

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
  'terminal',
] as const;

export type AdditionalToolKey = (typeof ADDITIONAL_TOOL_KEYS)[number];
const additionalToolKeys: Record<AdditionalToolKey, true> = {
  webSearch: true,
  fetchUrl: true,
  calculator: true,
  renderChart: true,
  renderDiagram: true,
  generatePdf: true,
  generateDocx: true,
  generateXlsx: true,
  generatePptx: true,
  removeImageBackground: true,
  terminal: true,
};

// Enable safe local capabilities for new and legacy agents. Network access and
// terminal execution remain opt-in.
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
  const unknown = normalized.filter(
    (key) => !additionalToolKeys[key as AdditionalToolKey],
  );
  if (unknown.length) {
    throw new ExpectedError(`Unknown additional tool: ${unknown.join(', ')}`);
  }
  return ADDITIONAL_TOOL_KEYS.filter((key) => normalized.includes(key));
};
