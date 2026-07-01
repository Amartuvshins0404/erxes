import { ExpectedError } from 'erxes-api-shared/utils';
import { getThreadTail } from '@/session/nativeStore';
import { deriveResourceId } from '~/mastra/memory';
import { scopedResource } from '~/mastra/memory/mastraMemory';
import { runWithAuth } from '~/mastra/requestContext';
import { buildModel, ProviderDocLike } from '~/mastra/providers';
import { ISkillContent } from '@/skills/@types/skills';
import { SKILL_LIMITS } from '@/skills/store/skillContent';

// Distill the current chat thread into a SKILL.md DRAFT with ONE model call,
// reusing the agent's own provider/model (via the existing provider builder) and
// the request's auth context. Shared by the makeSkill agent tool and the
// mastraSkillFromThread mutation. Persistence happens in the caller (createSkill)
// so this stays a pure transcript → draft step.

const DISTILL_INSTRUCTIONS = `You write reusable agent Skills (SKILL.md) from a finished conversation. A great Skill wrangles determinism out of a stochastic agent: it makes the next agent follow the same PROCESS on a similar request — the same way, not the same output.

Read the conversation, find the durable repeatable know-how, and distill it into a skill another agent loads next time.

## description — the skill's trigger (most important field)
- Front-load the primary keyword, then state WHAT it does and WHEN to use it.
- Name the trigger conditions concretely: "Use when the user wants…, asks to…, mentions…". One trigger per distinct case; drop synonyms.
- It is the only thing an agent sees before loading the skill — make every word earn its place. One to three sentences.

## instructions — the process (markdown body)
- Imperative and concrete. If there is a procedure, write ORDERED STEPS, and give each a checkable done-condition so the agent knows when it is complete (stops it ending a step early).
- Co-locate: keep a concept's rules, caveats and example together under one heading.
- Prefer compact, well-known terms the agent already reasons with over long explanations.
- GENERALIZE: strip everything specific to this one chat — names, ids, emails, record values, dates, numbers. Capture the approach, never the instance.

## Prune hard
- Every line must change behavior versus what an agent does by default. Delete anything it would already do (no-ops).
- One fact in one place — no duplication. Keep it tight; length is a cost.

If the conversation taught nothing reusable, still produce the best general skill its topic allows.

Output ONLY a JSON object — no code fences, no commentary:
{"name":"lowercase-hyphenated-name","description":"keyword-first what + when","instructions":"# Title\\n\\nmarkdown body"}
The name must be 1-64 chars, lowercase letters/numbers/hyphens only.`;

const buildTranscript = (
  messages: { role: string; content: string }[],
  maxChars = 24_000,
): string => {
  const lines = messages
    .filter((m) => (m.content ?? '').trim())
    .map(
      (m) =>
        `${m.role === 'assistant' ? 'Assistant' : 'User'}: ${m.content.trim()}`,
    );
  const transcript = lines.join('\n');
  return transcript.length > maxChars
    ? transcript.slice(transcript.length - maxChars)
    : transcript;
};

/** Lowercase-hyphenated slug within the spec's name length. */
const slugify = (raw: string, fallback = 'distilled-skill'): string => {
  const slug = (raw || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, SKILL_LIMITS.maxName);
  return slug || fallback;
};

const clip = (text: string, max: number): string =>
  text.length > max ? text.slice(0, max) : text;

/** Tolerant parse of the model's JSON draft into validated-ish content. */
const parseSkillDraft = (raw: string, nameHint?: string): ISkillContent => {
  let obj: Record<string, unknown> | undefined;
  try {
    const open = raw.indexOf('{');
    const close = raw.lastIndexOf('}');
    if (open !== -1 && close > open) {
      obj = JSON.parse(raw.slice(open, close + 1)) as Record<string, unknown>;
    }
  } catch {
    obj = undefined;
  }
  if (!obj) {
    throw new ExpectedError('Could not distill a skill from this conversation');
  }
  const name = slugify(
    String(obj.name ?? '') || nameHint || '',
    slugify(nameHint || 'distilled-skill'),
  );
  const description = clip(
    String(obj.description ?? '').trim() || 'A distilled skill.',
    SKILL_LIMITS.maxDescription,
  );
  const instructions = String(obj.instructions ?? '').trim();
  if (!instructions) {
    throw new ExpectedError('Could not distill skill instructions from this conversation');
  }
  return { name, description, instructions };
};

export interface DistillThreadParams {
  subdomain: string;
  agentId: string;
  threadId: string;
  userId: string;
  userHeader?: string;
  token?: string;
  provider: string;
  model: string;
  providers: ProviderDocLike[];
  nameHint?: string;
  scopeHint?: string;
}

export const distillThreadToSkill = async (
  params: DistillThreadParams,
): Promise<ISkillContent> => {
  const {
    subdomain,
    agentId,
    threadId,
    userId,
    userHeader,
    token,
    provider,
    model,
    providers,
    nameHint,
    scopeHint,
  } = params;

  const resourceId = scopedResource(
    subdomain,
    deriveResourceId({ user: { _id: userId }, agentId }),
  );
  const messages = await getThreadTail(subdomain, threadId, resourceId, 0);
  const transcript = buildTranscript(messages);
  if (!transcript.trim()) {
    throw new ExpectedError(
      'This conversation has no content to distill into a skill',
    );
  }

  const userContent = [
    'Conversation transcript:',
    transcript,
    '',
    ...(nameHint ? [`Suggested name: ${nameHint}`] : []),
    ...(scopeHint ? [`Scope hint: ${scopeHint}`] : []),
    'Output the JSON skill object.',
  ].join('\n');

  // Same one-shot, tool-less agent pattern as mastra/learning/extractor.ts.
  // The `as never` on the config mirrors agentRuntime.ts: Mastra's Agent
  // constructor generics reject a plain config object. The second cast narrows
  // to just the `generate` surface we use, with the duck-typed `{ text }` result
  // (the published generate() return type is a wire-chunk union, not this shape).
  const { Agent } = await import('@mastra/core/agent');
  const agent = new Agent({
    id: 'mastra-skill-maker',
    name: 'Skill Maker',
    instructions: DISTILL_INSTRUCTIONS,
    model: buildModel(provider, model, providers),
  } as never) as unknown as {
    generate: (msgs: unknown, opts?: unknown) => Promise<{ text?: string }>;
  };

  const result = await runWithAuth(
    { userHeader, token, userId, subdomain },
    () => agent.generate([{ role: 'user', content: userContent }], { maxSteps: 1 }),
  );

  const draft = parseSkillDraft(result?.text ?? '', nameHint);
  return {
    ...draft,
    category: scopeHint ? slugify(scopeHint) : undefined,
    userInvocable: true,
  };
};
