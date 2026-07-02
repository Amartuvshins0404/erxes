import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { getCurrentAuth } from '~/mastra/requestContext';
import type { ProviderDocLike } from '~/mastra/providers';
import { distillThreadToSkill } from '@/skills/service/distill';
import { createSkill } from '@/skills/service/skillsService';

// Agent tool: distill the CURRENT conversation into a SKILL.md DRAFT and persist
// it (status:draft, visibility:private, authorId=the requesting user). The model
// calls this when the user asks to "save this as a skill" / "remember how to do
// this". The thread + user are read from the request auth context (set in
// prepare.ts), so the tool needs no per-turn wiring; provider/model are baked in
// at construction from the agent's own config.

export interface MakeSkillDeps {
  provider: string;
  model: string;
  providers: ProviderDocLike[];
}

export const createMakeSkillTool = (deps: MakeSkillDeps) =>
  createTool({
    id: 'make_skill',
    description:
      'Distill the current conversation into a reusable Skill (a SKILL.md draft), generalizing away one-off details. Use when the user asks to save/remember the current approach as a skill. Creates a PRIVATE DRAFT the user can preview, edit and publish.',
    inputSchema: z.object({
      name: z
        .string()
        .optional()
        .describe('Optional suggested skill name (lowercase-hyphenated).'),
      scope: z
        .string()
        .optional()
        .describe('Optional scope/category hint, e.g. "sales".'),
    }),
    outputSchema: z.object({
      created: z.boolean(),
      name: z.string().optional(),
      description: z.string().optional(),
      status: z.string().optional(),
      message: z.string(),
    }),
    execute: async ({ name, scope }) => {
      const auth = getCurrentAuth();
      if (!auth?.userId || !auth.threadId || !auth.agentId) {
        return {
          created: false,
          message:
            'A skill can only be made from inside an active chat thread. No thread context was found.',
        };
      }
      // Mirror the sibling tools (knowledgeTool/learningTool): never throw a raw
      // error at the model — return a graceful {created:false, message}.
      try {
        const content = await distillThreadToSkill({
          subdomain: auth.subdomain || 'os',
          agentId: auth.agentId,
          threadId: auth.threadId,
          userId: auth.userId,
          userHeader: auth.userHeader,
          token: auth.token,
          provider: deps.provider,
          model: deps.model,
          providers: deps.providers,
          nameHint: name,
          scopeHint: scope,
        });
        const skill = await createSkill(auth.subdomain || 'os', auth.userId, {
          ...content,
          visibility: 'private',
        });
        return {
          created: true,
          name: skill.name,
          description: skill.description,
          status: skill.status,
          message: `Created a draft skill "${skill.name}". Preview, edit and publish it in the Skills UI.`,
        };
      } catch (e) {
        return {
          created: false,
          message: `Could not create a skill: ${(e as Error)?.message || e}`,
        };
      }
    },
  });
