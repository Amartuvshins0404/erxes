import { splitCamelWords } from '~/mastra/text';

// GraphQL does not expose the permission module for an operation. Keep this
// small name parser only for matching live operations to existing permission
// groups; it does not add search terms or descriptions.
const MODULE_PREFIXES = new Set([
  'all',
  'active',
  'current',
  'get',
  'my',
  'recent',
  'list',
  'total',
  'search',
  'add',
  'create',
  'save',
  'edit',
  'update',
  'remove',
  'delete',
  'detail',
  'details',
  'merge',
  'duplicate',
  'count',
  'tag',
  'assign',
  'change',
  'send',
  'verify',
  'resolve',
  'cancel',
  'confirm',
]);

export function deriveModule(operation: string): string {
  const words = splitCamelWords(operation || '');
  if (!words.length) return 'other';

  const first = words[0].toLowerCase();
  return words.length > 1 && MODULE_PREFIXES.has(first)
    ? words[1].toLowerCase()
    : first;
}

/** Fallback ownership when a live subgraph SDL is unavailable. */
export function detectPlugin(operationName: string): string | null {
  if (!operationName || operationName.startsWith('_')) return null;
  if (/^cp[A-Z]/.test(operationName)) return null;
  return operationName.match(/^([a-z]+)/)?.[1] || null;
}
