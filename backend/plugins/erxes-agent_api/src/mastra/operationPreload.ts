import type { ToolsInput } from '@mastra/core/agent';
import { splitCamelWords } from '~/mastra/text';

const STOP_WORDS: Record<string, true> = {
  a: true,
  an: true,
  and: true,
  for: true,
  from: true,
  get: true,
  in: true,
  me: true,
  my: true,
  of: true,
  on: true,
  the: true,
  to: true,
  with: true,
};

interface ToolSummary {
  id?: unknown;
  description?: unknown;
}

const MUTATION_REQUEST =
  /\b(?:add|archive|assign|change|convert|create|delete|edit|insert|make|merge|publish|register|remove|rename|save|set|toggle|unassign|update)\b|(?:үүсгэ|нэм|зас|өөрчил|устга|архив|хадгал|оноо)/i;

function isMutationTool(tool: ToolSummary): boolean {
  return (
    typeof tool.description === 'string' &&
    /\(mutation in [^)]+\)/i.test(tool.description)
  );
}

function searchableTokens(value: string): string[] {
  return splitCamelWords(value)
    .flatMap((part) => part.toLowerCase().split(/[^\p{L}\p{N}]+/u))
    .filter((part) => part.length > 1 && !STOP_WORDS[part]);
}

/**
 * Preload the three most relevant exact erxes operations into the first model
 * step. search_tools remains available when lexical matching misses.
 */
export function selectIntentOperationTools(
  message: string,
  operationTools: ToolsInput,
): ToolsInput {
  const requestTokens = new Set(searchableTokens(message));
  if (!requestTokens.size) return {};
  const allowMutations = MUTATION_REQUEST.test(message);

  const ranked = Object.entries(operationTools)
    .filter(
      ([, tool]) =>
        allowMutations || !isMutationTool(tool as unknown as ToolSummary),
    )
    .map(([name, tool]) => {
      const summary = tool as unknown as ToolSummary;
      const id = typeof summary.id === 'string' ? summary.id : name;
      const description =
        typeof summary.description === 'string' ? summary.description : '';
      const nameTokens = searchableTokens(`${name} ${id}`);
      const descriptionTokens = searchableTokens(description);
      const nameMatches = nameTokens.filter((token) =>
        requestTokens.has(token),
      );
      const descriptionMatches = descriptionTokens.filter((token) =>
        requestTokens.has(token),
      );
      return {
        name,
        tool,
        score: nameMatches.length * 5 + new Set(descriptionMatches).size,
      };
    })
    .filter(({ score }) => score > 0)
    .sort(
      (left, right) =>
        right.score - left.score || left.name.localeCompare(right.name),
    )
    .slice(0, 3);

  return Object.fromEntries(ranked.map(({ name, tool }) => [name, tool]));
}
