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
 * Plain text of editor content. Agencies write `brief` and `description` in the
 * block editor, so they arrive as serialized blocks — but records written
 * before that still hold plain strings. Use this wherever the value has to be
 * rendered as text (cards, list rows); the detail view renders the blocks
 * themselves with `BlockEditorReadOnly`.
 */
export const getBlockPlainText = (content?: string | null): string => {
  if (!content) return '';

  const blocks = parseBlocks(content);

  if (!blocks) return content;

  return blocks.map(blockText).filter(Boolean).join('\n').trim();
};
