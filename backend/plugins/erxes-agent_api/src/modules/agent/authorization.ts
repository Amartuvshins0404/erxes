import { z } from 'zod';
import type { FilterQuery } from 'mongoose';
import type {
  IUserDocument,
  PermissionScope,
} from 'erxes-api-shared/core-types';
import {
  erxesSubdomainHeaderName,
  ExpectedError,
  getPlugin,
  setUserHeader,
} from 'erxes-api-shared/utils';
import { IModels } from '~/connectionResolvers';
import { requireActionScope } from '@/_shared/authorization';
import type { IMastraAgentDocument } from '@/agent/@types/agent';

const OPERATION_TEAMS_QUERY = `
  query MastraAudienceTeams($userId: String!) {
    getTeams(userId: $userId) {
      _id
    }
  }
`;
const OPERATION_REQUEST_TIMEOUT_MS = 5_000;
const operationTeamsResponseSchema = z.object({
  data: z
    .object({
      getTeams: z.array(z.object({ _id: z.string() })).nullish(),
    })
    .optional(),
});

const teamIdsFromResponse = (payload: unknown): string[] => {
  const parsed = operationTeamsResponseSchema.safeParse(payload);
  if (!parsed.success) return [];

  return [
    ...new Set(
      (parsed.data.data?.getTeams ?? [])
        .map((team) => team._id.trim())
        .filter(Boolean),
    ),
  ];
};

export const resolveAgentAudienceTeamIds = async (
  subdomain: string,
  user: IUserDocument,
  scope: PermissionScope,
): Promise<string[]> => {
  if (scope !== 'group' || !user._id) return [];

  try {
    const operation = await getPlugin('operation');
    if (!operation.address) return [];

    const headers: Record<string, string> = {
      'content-type': 'application/json',
      [erxesSubdomainHeaderName]: subdomain,
    };
    setUserHeader(headers, user);
    const response = await fetch(`${operation.address}/graphql`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        operationName: 'MastraAudienceTeams',
        query: OPERATION_TEAMS_QUERY,
        variables: { userId: user._id },
      }),
      signal: AbortSignal.timeout(OPERATION_REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) return [];

    const payload: unknown = await response.json();
    return teamIdsFromResponse(payload);
  } catch {
    return [];
  }
};

export const agentAccessFilter = (
  user: Pick<IUserDocument, '_id' | 'departmentIds'>,
  scope: PermissionScope,
  teamIds: string[] = [],
): FilterQuery<IMastraAgentDocument> => {
  if (scope === 'all') return {};
  if (scope === 'own') return { createdBy: user._id };

  const sharedAudienceFilters: FilterQuery<IMastraAgentDocument>[] = [
    { visibility: 'shared', audienceUserIds: user._id },
  ];
  if (teamIds.length) {
    sharedAudienceFilters.push({
      visibility: 'shared',
      audienceTeamIds: { $in: teamIds },
    });
  }
  if (user.departmentIds?.length) {
    sharedAudienceFilters.push({
      visibility: 'shared',
      audienceDepartmentIds: { $in: user.departmentIds },
    });
  }

  return {
    $or: [
      { createdBy: user._id },
      { visibility: 'organization' },
      { visibility: { $exists: false } },
      ...sharedAudienceFilters,
    ],
  };
};

export const requireScopedAgent = async ({
  models,
  subdomain,
  user,
  action,
  agentId,
}: {
  models: IModels;
  subdomain: string;
  user: IUserDocument;
  action: string;
  agentId: string;
}) => {
  const scope = await requireActionScope({ subdomain, user, action });
  const teamIds = await resolveAgentAudienceTeamIds(subdomain, user, scope);
  const agent = await models.MastraAgent.findOne({
    _id: agentId,
    ...agentAccessFilter(user, scope, teamIds),
  });
  if (!agent) throw new ExpectedError('AI team member not found');

  return { agent, scope };
};
