import { FilterQuery, Model } from 'mongoose';
import { escapeRegExp, ExpectedError } from 'erxes-api-shared/utils';
import { IModels } from '~/connectionResolvers';
import { agentSchema } from '@/agent/db/definitions/agent';
import { IMastraAgent, IMastraAgentDocument } from '@/agent/@types/agent';
import { invalidateAgentCache } from '~/mastra/agentRuntime';

export interface IMastraAgentListParams {
  page?: number;
  perPage?: number;
  searchValue?: string;
  matchingAccountIds?: string[];
  filter?: FilterQuery<IMastraAgentDocument>;
}

export interface IMastraAgentListResult {
  list: IMastraAgentDocument[];
  totalCount: number;
}

export interface IMastraAgentModel extends Model<IMastraAgentDocument> {
  getAgent(_id: string): Promise<IMastraAgentDocument>;
  getAgents(
    filter?: FilterQuery<IMastraAgentDocument>,
  ): Promise<IMastraAgentDocument[]>;
  getAgentsList(
    params: IMastraAgentListParams,
  ): Promise<IMastraAgentListResult>;
  createAgent(userId: string, doc: IMastraAgent): Promise<IMastraAgentDocument>;
  updateAgent(
    userId: string,
    doc: Partial<IMastraAgent>,
  ): Promise<IMastraAgentDocument>;
  removeAgent(userId: string): Promise<{ deletedCount?: number }>;
}

/** Bind the MastraAgent statics onto the agent schema (mongoose loadClass). */
export const loadAgentClass = (_models: IModels) => {
  /** Static CRUD/query helpers for stored agent configurations. */
  // skipcq: JS-0327 — the mongoose loadClass pattern requires a class of statics
  class MastraAgent {
    /** Fetch the AI profile keyed by its canonical core user id. */
    public static async getAgent(userId: string) {
      const profile = await _models.MastraAgent.findOne({ _id: userId });
      if (!profile) throw new ExpectedError('AI team member not found');
      return profile;
    }

    /** All AI profiles, newest first. */
    public static getAgents(filter: FilterQuery<IMastraAgentDocument> = {}) {
      return _models.MastraAgent.find(filter).sort({ createdAt: -1 });
    }

    // Offset-paginated AI-team-member list. Identity fields live in core, so
    // account-name matches arrive as user ids from the resolver.
    public static async getAgentsList({
      page = 1,
      perPage = 30,
      searchValue,
      matchingAccountIds = [],
      filter: accessFilter = {},
    }: IMastraAgentListParams) {
      const searchRe = searchValue
        ? new RegExp(escapeRegExp(searchValue), 'i')
        : null;
      const searchFilter: FilterQuery<IMastraAgentDocument> = searchRe
        ? {
            $or: [
              { _id: { $in: matchingAccountIds } },
              { provider: searchRe },
              { model: searchRe },
            ],
          }
        : {};
      const filter: FilterQuery<IMastraAgentDocument> = searchRe
        ? { $and: [accessFilter, searchFilter] }
        : accessFilter;
      const limit = Math.min(Math.max(perPage, 1), 100);
      const skip = (Math.max(page, 1) - 1) * limit;

      const [list, totalCount] = await Promise.all([
        _models.MastraAgent.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        _models.MastraAgent.countDocuments(filter),
      ]);

      return { list, totalCount };
    }

    /** Create one AI profile under the owning core user id. */
    public static createAgent(userId: string, doc: IMastraAgent) {
      return _models.MastraAgent.create({ _id: userId, ...doc });
    }

    /** Update only Mastra runtime configuration, then evict its cache. */
    public static async updateAgent(
      userId: string,
      doc: Partial<IMastraAgent>,
    ) {
      const updated = await _models.MastraAgent.findOneAndUpdate(
        { _id: userId },
        { $set: doc },
        { new: true, runValidators: true },
      );
      if (!updated) throw new ExpectedError('AI team member not found');
      invalidateAgentCache(userId);
      return updated;
    }

    /** Remove the AI profile. The resolver deactivates its core account first. */
    public static removeAgent(userId: string) {
      invalidateAgentCache(userId);
      return _models.MastraAgent.deleteOne({ _id: userId });
    }
  }

  agentSchema.loadClass(MastraAgent);
  return agentSchema;
};
