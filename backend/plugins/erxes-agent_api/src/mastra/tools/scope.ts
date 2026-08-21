import type { AgentToolDescriptor } from 'erxes-api-shared/utils';

// An agent's tool scope.
//   mode 'all'    → may search/execute every native tool + every builtin.
//   mode 'custom' → restricted to `allowed`. Entries are one of:
//     - "<toolId>"         exact native tool      (e.g. "sales.model.Deals.find")
//     - "plugin:<name>"    every tool in a plugin  (e.g. "plugin:sales")
//     - "module:<name>"    every tool in a module  (e.g. "module:deals")
//     - "builtin:<key>"    a builtin tool          (e.g. "builtin:calculator")
export interface ToolPolicy {
  mode: 'all' | 'custom';
  allowed: string[];
}

// True when `tool` is within the policy. This is the programmatic boundary the
// search and execute meta-tools enforce: a restricted agent literally cannot run
// anything outside its allowlist, even if the model invents a tool name.
export function isOperationAllowed(
  tool: AgentToolDescriptor,
  policy: ToolPolicy,
): boolean {
  if (policy.mode === 'all') return true;
  return (
    policy.allowed.includes(tool.id) ||
    policy.allowed.includes(`plugin:${tool.plugin}`) ||
    policy.allowed.includes(`module:${tool.module}`)
  );
}

/** True when the policy grants the given builtin tool key. */
export function isBuiltinAllowed(key: string, policy: ToolPolicy): boolean {
  if (policy.mode === 'all') return true;
  return policy.allowed.includes(`builtin:${key}`);
}

// True when the policy grants at least one erxes capability, so the runtime
// knows whether to bind the search meta-tools at all.
export function hasAnyOperation(
  list: AgentToolDescriptor[],
  policy: ToolPolicy,
): boolean {
  if (policy.mode === 'all') return list.length > 0;
  return list.some((tool) => isOperationAllowed(tool, policy));
}

// A short human description of the allowed scope, injected into the system
// prompt so the model accurately understands its own reach.
export function scopeSummary(policy: ToolPolicy): string {
  if (policy.mode === 'all') {
    return 'You may use any capability listed in the installed-services inventory below — and ONLY those.';
  }

  const ops: string[] = [];
  const groups: string[] = [];
  for (const entry of policy.allowed) {
    if (entry.startsWith('plugin:'))
      groups.push(`all ${entry.slice(7)} capabilities`);
    else if (entry.startsWith('module:'))
      groups.push(`all ${entry.slice(7)} capabilities`);
    else if (entry.startsWith('builtin:')) continue;
    else ops.push(entry);
  }

  const parts = [...groups, ...ops];
  if (!parts.length) {
    return 'You have no erxes capabilities available.';
  }
  return `You are restricted to ONLY these capabilities — never attempt anything else: ${parts.join(
    ', ',
  )}.`;
}

// The agent's ground truth about what is actually installed, derived from the
// live registry (after policy filtering). Injected into the system prompt so
// the model answers "what can you do?" from reality instead of LLM priors
// about what a CRM usually has (it used to advertise deals/sales/automations
// on instances where those plugins aren't even running).
export function capabilityInventory(
  list: AgentToolDescriptor[],
  policy: ToolPolicy,
): { lines: string[]; fingerprint: string } {
  const allowed =
    policy.mode === 'all'
      ? list
      : list.filter((tool) => isOperationAllowed(tool, policy));

  // plugin → module → {reads, writes}
  const plugins = new Map<
    string,
    Map<string, { reads: number; writes: number }>
  >();
  for (const tool of allowed) {
    const pluginName = tool.plugin || 'other';
    const moduleName = tool.module || 'other';
    let mods = plugins.get(pluginName);
    if (!mods) {
      mods = new Map();
      plugins.set(pluginName, mods);
    }
    let counts = mods.get(moduleName);
    if (!counts) {
      counts = { reads: 0, writes: 0 };
      mods.set(moduleName, counts);
    }
    if (tool.method === 'mutation') counts.writes++;
    else counts.reads++;
  }

  const MAX_MODULES_SHOWN = 30;
  const lines: string[] = [];
  for (const [plugin, mods] of [...plugins.entries()].sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    const names = [...mods.keys()].sort((a, b) => a.localeCompare(b));
    const shown = names.slice(0, MAX_MODULES_SHOWN).join(', ');
    const more =
      names.length > MAX_MODULES_SHOWN
        ? `, +${names.length - MAX_MODULES_SHOWN} more`
        : '';
    const total = [...mods.values()].reduce(
      (sum, counts) => sum + counts.reads + counts.writes,
      0,
    );
    lines.push(`- ${plugin} (${total} capabilities): ${shown}${more}`);
  }

  // Stable identity of the installed/allowed surface — used to bust the agent
  // cache when plugins are enabled/disabled, so the prompt never goes stale.
  const policyFingerprint =
    policy.mode === 'custom' ? [...policy.allowed].sort().join(',') : 'all';
  const fingerprint = `${[...plugins.keys()]
    .sort((a, b) => a.localeCompare(b))
    .join(',')}#${allowed.length}#${policyFingerprint}`;

  return { lines, fingerprint };
}
