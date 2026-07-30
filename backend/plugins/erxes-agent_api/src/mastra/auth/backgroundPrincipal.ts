import { ExpectedError } from 'erxes-api-shared/utils';
import type { IModels } from '~/connectionResolvers';
import type { IMastraAgentDocument } from '@/agent/@types/agent';
import type { WorkflowDefinition } from '../workflows/dsl';
import { mintRunToken } from './runToken';
import { getAgentAccount } from './servicePrincipal';

const CONFIGURE_APP_TOKEN =
  'Agent runs execute as the AI team member; configure the erxes app token in Agent settings.';

/** Auth propagated to every agent tool under the canonical core user. */
export interface AgentPrincipalAuthCtx {
  token: string;
  userHeader: string;
  principalUserId: string;
  subdomain: string;
  background: boolean;
  agentId: string;
}

export type AgentPrincipalResult =
  | { ok: true; authCtx: AgentPrincipalAuthCtx }
  | { ok: false; error: string };

export type PrincipalSource =
  | Pick<IMastraAgentDocument, '_id'>
  | null
  | undefined;

/** Resolve and mint a token for the AI team-member account. Never falls back. */
export async function resolveAgentPrincipal(opts: {
  agentConfig: PrincipalSource;
  subdomain: string;
  appToken: string | undefined;
  models: IModels;
  background: boolean;
}): Promise<AgentPrincipalResult> {
  const { agentConfig, subdomain, appToken, background } = opts;
  const clientToken = appToken?.trim();
  if (!clientToken) {
    return { ok: false, error: `Agent run refused: ${CONFIGURE_APP_TOKEN}` };
  }

  const userId = agentConfig?._id;
  if (!userId) {
    return {
      ok: false,
      error: 'Agent run refused: no AI team-member identity could be resolved.',
    };
  }

  let account;
  try {
    account = await getAgentAccount({ userId, subdomain });
  } catch {
    return {
      ok: false,
      error:
        'Agent run refused: the AI team-member account is missing or inactive. Not falling back to the app token.',
    };
  }
  if (
    !account.permissionGroupIds?.length &&
    !account.customPermissions?.length
  ) {
    return {
      ok: false,
      error:
        'Agent run refused: the AI team member has no permissions. Assign its permissions in Team Members.',
    };
  }

  const minted = await mintRunToken({
    userId,
    subdomain,
    appToken: clientToken,
  });
  if (!minted) {
    return {
      ok: false,
      error:
        'Agent run refused: could not mint a token for the AI team member. Not falling back to the app token.',
    };
  }

  return {
    ok: true,
    authCtx: {
      token: minted,
      userHeader: Buffer.from(
        JSON.stringify({
          _id: userId,
          role: 'user',
          isOwner: false,
          isActive: account.isActive !== false,
          permissionGroupIds: account.permissionGroupIds ?? [],
          customPermissions: account.customPermissions ?? [],
        }),
      ).toString('base64'),
      principalUserId: userId,
      subdomain,
      background,
      agentId: userId,
    },
  };
}

/** Enable-time preconditions for unattended runs. */
export function backgroundRunEnableError(opts: {
  destructiveAllow: boolean;
  subject: string;
  appToken: string | undefined;
  hasPermissions: boolean;
}): string | null {
  const { destructiveAllow, subject, appToken, hasPermissions } = opts;
  if (!appToken?.trim()) {
    return `Cannot enable this ${subject}: ${CONFIGURE_APP_TOKEN}`;
  }
  if (!hasPermissions) {
    return `Cannot enable this ${subject}: assign permissions to its AI team member first.`;
  }
  if (destructiveAllow) {
    return `Cannot enable this ${subject}: destructiveOps is "allow", which is refused for unattended background runs — deletes/merges must never run on a cron. Set destructiveOps to "ask".`;
  }
  return null;
}

/** Scheduled workflows require an active owning AI team member. */
export const assertWorkflowSchedulable = async (opts: {
  models: IModels;
  subdomain: string;
  agentId: string | undefined;
  definition: WorkflowDefinition;
}) => {
  if (opts.definition?.trigger?.type !== 'schedule') return;
  const agentId = opts.agentId?.trim();
  if (!agentId) {
    throw new ExpectedError(
      'Cannot enable this workflow: it has no owning AI team member — assign one before enabling.',
    );
  }
  const agent = await opts.models.MastraAgent.findOne({ _id: agentId });
  if (!agent) {
    throw new ExpectedError(
      `Cannot enable this workflow: its owning AI team member "${agentId}" was not found.`,
    );
  }

  let account;
  try {
    account = await getAgentAccount({
      userId: agentId,
      subdomain: opts.subdomain,
    });
  } catch {
    throw new ExpectedError(
      `Cannot enable this workflow: its owning AI team member "${agentId}" is missing or inactive.`,
    );
  }
  const settings = await opts.models.MastraSettings.getSettings();
  const error = backgroundRunEnableError({
    destructiveAllow: agent.destructiveOps === 'allow',
    subject: 'workflow',
    appToken: settings?.erxesApiToken,
    hasPermissions: Boolean(
      account.permissionGroupIds?.length || account.customPermissions?.length,
    ),
  });
  if (error) throw new ExpectedError(error);
};
