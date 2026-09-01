import { IContext } from '~/connectionResolvers';
import { BLOCK_VERIFICATION_STATUS } from '~/constants';
import { sendBlockMessage } from '~/modules/block/utils';

export const developerMutations = {
  blockAdminUpdateDeveloper: async (
    _parent: undefined,
    { _id, input }: { _id: string; input: any },
    { models }: IContext,
  ) => {
    const developer = await models.Developer.findOne({ _id });

    if (!developer) {
      throw new Error('Developer not found');
    }

    try {
      const { subdomain, entityId } = developer;

      const doc = { ...input }

      const updatedDeveloper = await models.Developer.findOneAndUpdate(
        { _id, subdomain, entityId },
        { ...doc },
        { new: true },
      );

      return updatedDeveloper;
    } catch (error) {
      throw new Error(`Failed to update project general info: ${error}`);
    }
  },
  updateBlockAdminDeveloperVerificationStatus: async (
    _root: undefined,
    {
      developerId,
      status,
      message,
    }: { developerId: string; status: string; message?: string },
    { models }: IContext,
  ) => {
    const developer = await models.Developer.findOne({ _id: developerId });

    if (!developer) {
      throw new Error('Developer not found');
    }

    if (developer.verificationStatus === status) {
      throw new Error('Already executed this action');
    }

    if (
      status !== BLOCK_VERIFICATION_STATUS.VERIFIED &&
      status !== BLOCK_VERIFICATION_STATUS.UNVERIFIED
    ) {
      throw new Error('Invalid status');
    }

    try {
      const { _id, subdomain, entityId } = developer;

      const response = await sendBlockMessage({
        subdomain,
        path: 'updateDeveloperVerificationStatus',
        payload: { data: { status, message }, entityId },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to update developer verification status: ${response.statusText}`,
        );
      }

      const updatedDeveloper = await models.Developer.findOneAndUpdate(
        { _id },
        { verificationStatus: status },
        { new: true },
      );

      return updatedDeveloper;
    } catch (error) {
      throw new Error(
        `Failed to update developer verification status: ${error}`,
      );
    }
  },
};
