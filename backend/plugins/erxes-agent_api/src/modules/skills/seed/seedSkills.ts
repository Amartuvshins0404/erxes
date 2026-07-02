import type { SkillsStorage } from '@mastra/core/storage/domains/skills';
import { ISkillContent } from '@/skills/@types/skills';
import { newSkillId, systemAuthorId } from '@/skills/store/tenancy';
import { buildSnapshotMetadata } from '@/skills/store/skillContent';

// Global default skills, seeded per subdomain on first skills access. They teach
// an agent how to interact with the erxes API — derived from this plugin's real
// tool conventions (the search_erxes_operations / execute_erxes_operation
// meta-tools and the destructive-ops approval flow). Seeded as
// visibility:public, authorId=<subdomain>::system, status:published, and NOT
// user-invocable (they are background guidance the SkillsProcessor surfaces, not
// /slash commands). Idempotent: only inserted when absent by name.

export const SEED_SKILLS: ISkillContent[] = [
  {
    name: 'erxes-operations',
    category: 'erxes',
    userInvocable: false,
    description:
      'Find and run erxes data operations — discover the exact one, then execute it. Use when the user wants to read, create, update, or look up business data: deals, contacts, companies, tasks, tickets, products.',
    instructions: [
      '# Working with erxes operations',
      '',
      'erxes exposes its data through named operations. You do NOT know them all',
      'up front — discover the exact one each time.',
      '',
      '## The two-step loop',
      '1. **Discover** — call `search_erxes_operations` FIRST with a natural-language',
      '   query (e.g. "create deal", "list companies by name"). It returns ranked',
      '   operations with their exact `name`, `operationType` (query/mutation), and',
      '   the arguments + selectable fields for the top matches.',
      '2. **Execute** — call `execute_erxes_operation` with the EXACT `name` from the',
      '   search result and the arguments it listed. Never invent operation names.',
      '',
      'Done when you have run the exact named operation the search returned — never',
      'a guessed name.',
      '',
      '## Naming conventions',
      '- Mutations end in a verb: `...Add` (create), `...Edit` (update),',
      '  `...Remove` (delete). Example: `dealsAdd`, `dealsEdit`, `dealsRemove`.',
      '- Reads are the plural list (e.g. `deals`) or a `...Detail` for one record',
      '  (e.g. `dealDetail`). Map the user’s verb onto these (create→Add, etc.).',
      '',
      '## Tips',
      '- If the first search misses, rephrase with the entity noun + the action.',
      '- Pass only arguments the operation declares; respect required ones.',
      '- For lists, prefer paginating (page/perPage) over fetching everything.',
      '- Select just the fields you need for the answer.',
    ].join('\n'),
  },
  {
    name: 'erxes-safe-changes',
    category: 'erxes',
    userInvocable: false,
    description:
      'Confirm and gate irreversible erxes changes. Use before any delete, remove, merge, or bulk-update operation.',
    instructions: [
      '# Making changes safely',
      '',
      'Some operations cannot be undone — deletes (`...Remove`), merges, and bulk',
      'updates. Treat them with care.',
      '',
      '## Rules',
      '- Before a destructive operation, briefly confirm WHAT will change and WHICH',
      '  records are affected, in plain language.',
      '- The runtime may require explicit user approval for destructive operations.',
      '  If an execution is blocked pending approval, ask the user to confirm and',
      '  retry only after they agree — do not try to bypass the gate.',
      '- Prefer a reversible path when one exists (e.g. editing a status instead of',
      '  deleting a record).',
      '- Never delete or merge "to clean up" unless the user explicitly asked.',
      '',
      '## After a change',
      '- Read back / summarise the result so the user can verify it.',
      '- Report exactly what was created, edited or removed.',
    ].join('\n'),
  },
  {
    name: 'erxes-answering',
    category: 'erxes',
    userInvocable: false,
    description:
      "Turn erxes data into clear business answers. Use when presenting any operation's results to the user.",
    instructions: [
      '# Answering with erxes data',
      '',
      'You serve business users, not engineers. Translate raw data into useful',
      'answers.',
      '',
      '## Do',
      '- Lead with the answer, then the supporting detail.',
      '- Use the record’s human label (name/title) — never raw ids or internal codes.',
      '- Format money, dates and counts the way a person reads them.',
      '- Summarise lists (totals, top items) instead of dumping every field.',
      '',
      '## Don’t',
      '- Don’t expose internal ids, raw API names, HTTP codes or stack traces.',
      '- Don’t leave the user stranded — if an operation fails, say what you tried',
      '  in plain terms and suggest the next step.',
      '- Don’t fabricate data. If a value is missing, say so.',
    ].join('\n'),
  },
];

/** Insert any missing global default skills for a subdomain (idempotent). */
export const ensureSeedSkills = async (
  subdomain: string,
  skills: SkillsStorage,
): Promise<void> => {
  const existing = await skills.listResolved({
    authorId: systemAuthorId(subdomain),
    perPage: false,
  });
  const have = new Set(existing.skills.map((s) => s.name));

  for (const def of SEED_SKILLS) {
    if (have.has(def.name)) continue;
    const id = newSkillId(subdomain);
    await skills.create({
      skill: {
        id,
        authorId: systemAuthorId(subdomain),
        visibility: 'public',
        name: def.name,
        description: def.description,
        instructions: def.instructions,
        metadata: buildSnapshotMetadata(subdomain, def),
      },
    });
    const latest = await skills.getLatestVersion(id);
    if (latest) {
      await skills.update({ id, status: 'published', activeVersionId: latest.id });
    }
  }
};
