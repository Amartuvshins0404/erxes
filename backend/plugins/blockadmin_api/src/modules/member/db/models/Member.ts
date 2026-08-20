import {
  IBlockAdminAgent,
  IBlockAdminAgentDocument,
} from '@/member/@types/member';
import { Model } from 'mongoose';
import { IModels } from '~/connectionResolvers';
import { agentSchema } from '../definitions/member';

export interface IBlockAdminAgentModel extends Model<IBlockAdminAgentDocument> {
  getAgent(
    subdomain: string,
    entityId: string,
  ): Promise<IBlockAdminAgentDocument>;
  saveAgent(
    subdomain: string,
    entityId: string,
    input: Partial<IBlockAdminAgent>,
  ): Promise<IBlockAdminAgentDocument>;
  removeAgent(subdomain: string, entityId: string): Promise<{ ok?: number }>;
}

export const loadBlockAdminAgentClass = (models: IModels) => {
  class Agent {
    public static async getAgent(subdomain: string, entityId: string) {
      const agent = await models.AgencyMember.findOne({
        subdomain,
        entityId,
      }).lean();

      if (!agent) {
        throw new Error('Agent not found');
      }

      return agent;
    }

    /**
     * The agency side is the source of truth and may replay a member webhook,
     * so every sync is an upsert keyed by tenant + agency-side member id.
     */
    public static async saveAgent(
      subdomain: string,
      entityId: string,
      input: Partial<IBlockAdminAgent>,
    ) {
      return models.AgencyMember.findOneAndUpdate(
        { subdomain, entityId },
        { $set: input, $setOnInsert: { subdomain, entityId } },
        { new: true, upsert: true },
      );
    }

    public static async removeAgent(subdomain: string, entityId: string) {
      return models.AgencyMember.deleteOne({ subdomain, entityId });
    }
  }

  agentSchema.loadClass(Agent);

  return agentSchema;
};
