import { parseBlocks } from 'erxes-ui';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const inlineText = (value: unknown): string => {
  if (typeof value === 'string') return value;

  if (Array.isArray(value)) return value.map(inlineText).join('');

  if (isRecord(value)) {
    if (typeof value.text === 'string') return value.text;
    if ('content' in value) return inlineText(value.content);
  }

  return '';
};

const blockText = (block: unknown): string => {
  if (!isRecord(block)) return '';

  const children = Array.isArray(block.children)
    ? block.children.map(blockText).filter(Boolean).join('\n')
    : '';

  return [inlineText(block.content), children].filter(Boolean).join('\n');
};

/**
 * Plain text of editor content. `brief` and `description` are edited with the
 * block editor, so they hold serialized blocks — but records written before
 * that still hold plain strings, and both have to read the same way for
 * character counts and plain-text surfaces.
 */
export const getBlockPlainText = (content?: string | null): string => {
  if (!content) return '';

  const blocks = parseBlocks(content);

  if (!blocks) return content;

  return blocks.map(blockText).filter(Boolean).join('\n').trim();
};
