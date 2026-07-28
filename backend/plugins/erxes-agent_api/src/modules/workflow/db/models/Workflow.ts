import { Model } from 'mongoose';
import { ExpectedError } from 'erxes-api-shared/utils';
import { IModels } from '~/connectionResolvers';
import { workflowSchema } from '@/workflow/db/definitions/workflow';
import {
  IMastraWorkflow,
  IMastraWorkflowDocument,
} from '@/workflow/@types/workflow';
import { validateDefinition } from '~/mastra/workflows/dsl';

export interface IMastraWorkflowModel extends Model<IMastraWorkflowDocument> {
  getWorkflow(_id: string): Promise<IMastraWorkflowDocument>;
  getWorkflows(filter?: {
    agentId?: string;
    agentIds?: string[];
  }): Promise<IMastraWorkflowDocument[]>;
  createWorkflow(doc: IMastraWorkflow): Promise<IMastraWorkflowDocument>;
  updateWorkflow(
    _id: string,
    doc: Partial<IMastraWorkflow>,
  ): Promise<IMastraWorkflowDocument>;
  setEnabled(_id: string, isEnabled: boolean): Promise<IMastraWorkflowDocument>;
  approveWorkflow(
    _id: string,
    approvedByUserId: string,
    reviewedVersion: number,
    reviewedUpdatedAt: Date,
  ): Promise<IMastraWorkflowDocument>;
  removeWorkflow(_id: string): Promise<{ ok: number }>;
}

// Structural safety net at the model layer. Resolvers run the FULL validation
// (with the live operation registry) before calling these; this re-check only
// guards against definitions reaching Mongo through some future code path that
// skipped it.
const assertStructurallyValid = (definition: unknown) => {
  const check = validateDefinition(definition);
  if (!check.ok) {
    const first = check.errors[0];
    throw new ExpectedError(
      `Invalid workflow definition: ${first.path}: ${first.message}`,
    );
  }
};

export const loadWorkflowClass = (_models: IModels) => {
  class MastraWorkflow {
    public static async getWorkflow(_id: string) {
      const workflow = await _models.MastraWorkflow.findOne({ _id });
      if (!workflow) throw new ExpectedError('Workflow not found');
      return workflow;
    }

    public static async getWorkflows(
      filter: { agentId?: string; agentIds?: string[] } = {},
    ) {
      const query = filter.agentId
        ? { agentId: filter.agentId }
        : filter.agentIds
        ? { agentId: { $in: filter.agentIds } }
        : {};
      return _models.MastraWorkflow.find(query).sort({ createdAt: -1 });
    }

    public static async createWorkflow(doc: IMastraWorkflow) {
      assertStructurallyValid(doc.definition);
      return _models.MastraWorkflow.create({
        ...doc,
        version: 1,
        isEnabled: false,
        approvalStatus: 'draft',
        approvedByUserId: null,
        approvedAt: null,
      });
    }

    public static async updateWorkflow(
      _id: string,
      doc: Partial<IMastraWorkflow>,
    ) {
      const existing = await MastraWorkflow.getWorkflow(_id);

      let versionBump = false;
      if (doc.definition) {
        assertStructurallyValid(doc.definition);
        versionBump =
          JSON.stringify(doc.definition) !==
          JSON.stringify(existing.definition);
      }

      const updated = await _models.MastraWorkflow.findOneAndUpdate(
        { _id },
        {
          $set: {
            ...doc,
            isEnabled: false,
            approvalStatus: 'draft',
            approvedByUserId: null,
            approvedAt: null,
          },
          ...(versionBump ? { $inc: { version: 1 } } : {}),
        },
        { new: true },
      );
      if (!updated) throw new ExpectedError('Workflow not found');
      return updated;
    }

    public static async approveWorkflow(
      _id: string,
      approvedByUserId: string,
      reviewedVersion: number,
      reviewedUpdatedAt: Date,
    ) {
      const updated = await _models.MastraWorkflow.findOneAndUpdate(
        {
          _id,
          version: reviewedVersion,
          updatedAt: reviewedUpdatedAt,
          approvalStatus: 'draft',
        },
        {
          $set: {
            approvalStatus: 'approved',
            approvedByUserId,
            approvedAt: new Date(),
          },
        },
        { new: true },
      );
      if (!updated) {
        throw new ExpectedError(
          'Workflow changed or was already approved while it was being reviewed; reload it before approving.',
        );
      }
      return updated;
    }

    public static async setEnabled(_id: string, isEnabled: boolean) {
      const updated = await _models.MastraWorkflow.findOneAndUpdate(
        {
          _id,
          ...(isEnabled ? { approvalStatus: 'approved' } : {}),
        },
        { $set: { isEnabled } },
        { new: true },
      );
      if (!updated) {
        throw new ExpectedError(
          isEnabled
            ? 'Workflow must be approved before it can be enabled'
            : 'Workflow not found',
        );
      }
      return updated;
    }

    public static async removeWorkflow(_id: string) {
      await _models.MastraWorkflowRun.deleteMany({ workflowId: _id });
      return _models.MastraWorkflow.deleteOne({ _id });
    }
  }

  workflowSchema.loadClass(MastraWorkflow);
  return workflowSchema;
};
