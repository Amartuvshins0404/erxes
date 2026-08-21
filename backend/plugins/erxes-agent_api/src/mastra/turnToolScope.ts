const SKILL_TOOLS = ['skill', 'skill_search', 'skill_read'] as const;

export interface TurnToolScopeInput {
  availableToolNames: string[];
  hasErxesOperations?: boolean;
  skillsEnabled?: boolean;
}

/**
 * Every permission-approved tool is active on every turn — the model decides
 * what to call. No keyword heuristics (they silently hid valid tools behind
 * unlisted phrasing). The only surface that stays search-gated is the erxes
 * operation catalog: thousands of operations are discovered via search_tools,
 * which is model-driven, not regex-driven.
 */
export function selectTurnActiveTools({
  availableToolNames,
  hasErxesOperations = false,
  skillsEnabled = false,
}: TurnToolScopeInput): string[] {
  const active = new Set(availableToolNames);
  if (hasErxesOperations) active.add('search_tools');
  if (skillsEnabled) {
    for (const name of SKILL_TOOLS) active.add(name);
  }
  return [...active];
}
