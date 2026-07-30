import { IUserDocument } from 'erxes-api-shared/core-types';
import { ExpectedError } from 'erxes-api-shared/utils';
import { IModels } from '~/connectionResolvers';
import { getWorkflowAgentAccess } from '@/workflow/authorization';

export const requireScopedLearning = async ({
  models,
  subdomain,
  user,
  action,
  learningId,
}: {
  models: IModels;
  subdomain: string;
  user: IUserDocument;
  action: string;
  learningId: string;
}) => {
  const [learning, access] = await Promise.all([
    models.MastraLearning.findOne({ _id: learningId }),
    getWorkflowAgentAccess({ models, subdomain, user, action }),
  ]);

  if (
    !learning ||
    (learning.agentId
      ? !access.agentIds.includes(learning.agentId)
      : access.scope !== 'all')
  ) {
    throw new ExpectedError('Learning not found');
  }

  return { learning, access };
};
