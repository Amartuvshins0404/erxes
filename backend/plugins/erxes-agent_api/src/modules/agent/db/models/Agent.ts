import { FilterQuery, Model } from 'mongoose';
import { PermissionScope } from 'erxes-api-shared/core-types';
import { escapeRegExp, ExpectedError } from 'erxes-api-shared/utils';
import { IModels } from '~/connectionResolvers';
import { agentSchema } from '@/agent/db/definitions/agent';
import { IMastraAgent, IMastraAgentDocument } from '@/agent/@types/agent';
import { invalidateAgentCache } from '~/mastra/agentRuntime';
import { visibilityFilter } from '@/agent/utils';
const AGENT_SUMMARY_PROJECTION = {
  _id: 1,
  name: 1,
  agentId: 1,
  description: 1,
  isEnabled: 1,
  visibility: 1,
  teamId: 1,
  departmentId: 1,
  unitId: 1,
  createdBy: 1,
  createdAt: 1,
  updatedAt: 1,
} as const;

export interface IMastraAgentListParams {
  page?: number;
  perPage?: number;
  searchValue?: string;
  userId?: string;
  scope?: PermissionScope;
  teamIds?: string[];
  deptIds?: string[];
  unitIds?: string[];
}

export interface IMastraAgentListResult {
  list: IMastraAgentDocument[];
  totalCount: number;
}

export interface IMastraAgentModel extends Model<IMastraAgentDocument> {
  getAgent(
    _id: string,
    userId?: string,
    scope?: PermissionScope,
    teamIds?: string[],
    deptIds?: string[],
    unitIds?: string[],
  ): Promise<IMastraAgentDocument>;
  getAgents(
    userId?: string,
    scope?: PermissionScope,
    teamIds?: string[],
    deptIds?: string[],
    unitIds?: string[],
  ): Promise<IMastraAgentDocument[]>;
  getAgentsInternal(): Promise<IMastraAgentDocument[]>;
  getAgentsList(
    params: IMastraAgentListParams,
  ): Promise<IMastraAgentListResult>;
  createAgent(doc: IMastraAgent): Promise<IMastraAgentDocument>;
  updateAgent(
    _id: string,
    doc: Partial<IMastraAgent>,
    createdBy?: string,
  ): Promise<IMastraAgentDocument>;
  removeAgent(_id: string, createdBy?: string): Promise<{ ok: number }>;
}

/** Bind the MastraAgent statics onto the agent schema (mongoose loadClass). */
export const loadAgentClass = (_models: IModels) => {
  /** Static CRUD/query helpers for stored agent configurations. */
  // skipcq: JS-0327 — the mongoose loadClass pattern requires a class of statics
  class MastraAgent {
    /** Fetch one agent config by _id; throws when not found or not visible to caller. */
    public static async getAgent(
      _id: string,
      userId?: string,
      scope: PermissionScope = 'own',
      teamIds: string[] = [],
      deptIds: string[] = [],
      unitIds: string[] = [],
    ) {
      const filter: FilterQuery<IMastraAgentDocument> = userId
        ? { _id, ...visibilityFilter(userId, scope, teamIds, deptIds, unitIds) }
        : { _id };
      const agent = await _models.MastraAgent.findOne(filter);
      if (!agent) throw new ExpectedError('Agent not found');
      return agent;
    }

    /** All agents visible to caller, newest first. */
    public static getAgents(
      userId?: string,
      scope: PermissionScope = 'own',
      teamIds: string[] = [],
      deptIds: string[] = [],
      unitIds: string[] = [],
    ) {
      const filter: FilterQuery<IMastraAgentDocument> = userId
        ? visibilityFilter(userId, scope, teamIds, deptIds, unitIds)
        : {};
      return _models.MastraAgent.find(filter)
        .select(AGENT_SUMMARY_PROJECTION)
        .sort({ createdAt: -1 });
    }

    /** Full agent configs for trusted in-process consumers such as Mastra Studio. */
    public static getAgentsInternal() {
      return _models.MastraAgent.find({}).sort({ createdAt: -1 });
    }

    // Offset-paginated list for the Agents settings table (scroll-triggered
    // "load more" on the frontend). Newest first; free-text search across
    // safe summary fields: name / id / description.
    public static async getAgentsList({
      page = 1,
      perPage = 30,
      searchValue,
      userId,
      scope = 'own',
      teamIds = [],
      deptIds = [],
      unitIds = [],
    }: IMastraAgentListParams) {
      const baseFilter: FilterQuery<IMastraAgentDocument> = userId
        ? visibilityFilter(userId, scope, teamIds, deptIds, unitIds)
        : {};

      const searchRe = searchValue
        ? new RegExp(escapeRegExp(searchValue), 'i')
        : null;
      const filter: FilterQuery<IMastraAgentDocument> = searchRe
        ? {
            $and: [
              baseFilter,
              {
                $or: [
                  { name: searchRe },
                  { agentId: searchRe },
                  { description: searchRe },
                ],
              },
            ],
          }
        : baseFilter;

      const limit = Math.min(Math.max(perPage, 1), 100);
      const skip = (Math.max(page, 1) - 1) * limit;

      const [list, totalCount] = await Promise.all([
        _models.MastraAgent.find(filter)
          .select(AGENT_SUMMARY_PROJECTION)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        _models.MastraAgent.countDocuments(filter),
      ]);

      return { list, totalCount };
    }

    /** Create a new agent config. */
    public static createAgent(doc: IMastraAgent) {
      return _models.MastraAgent.create(doc);
    }

    /** Update an agent config and evict its cached runtime agent.
     *  Pass createdBy to atomically enforce ownership for non-admins. */
    public static async updateAgent(
      _id: string,
      doc: Partial<IMastraAgent>,
      createdBy?: string,
    ) {
      const filter = createdBy ? { _id, createdBy } : { _id };
      const updated = await _models.MastraAgent.findOneAndUpdate(
        filter,
        { $set: doc },
        { new: true, runValidators: true },
      );
      if (!updated) throw new ExpectedError('Agent not found');
      invalidateAgentCache(_id);
      return updated;
    }

    /** Delete an agent config and evict its cached runtime agent.
     *  Pass createdBy to atomically enforce ownership for non-admins. */
    public static removeAgent(_id: string, createdBy?: string) {
      invalidateAgentCache(_id);
      const filter = createdBy ? { _id, createdBy } : { _id };
      return _models.MastraAgent.deleteOne(filter);
    }
  }

  agentSchema.loadClass(MastraAgent);
  return agentSchema;
};
