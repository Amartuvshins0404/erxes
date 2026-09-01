import { checkLogin } from 'erxes-api-shared/core-modules';
import { IContext } from '~/connectionResolvers';
import { BlockUnitStatus } from '~/modules/unit-assignment/db/unitAssignment';

export const blockUnitMutations = {
  blockAgencyAssignUnitToMember: async (
    _root: undefined,
    { _id, memberId }: { _id: string; memberId?: string },
    { models, user }: IContext,
  ) => {
    checkLogin(user);

    const assignment = await models.BlockUnitAssignment.findOneAndUpdate(
      { _id },
      { $set: { memberId: memberId || null } },
      { new: true },
    ).lean();

    if (!assignment) {
      throw new Error(`Unit assignment "${_id}" not found`);
    }

    return assignment;
  },

  blockAgencyUpdateUnitStatus: async (
    _root: undefined,
    { _id, status }: { _id: string; status: BlockUnitStatus },
    { models, user }: IContext,
  ) => {
    checkLogin(user);

    const assignment = await models.BlockUnitAssignment.findOneAndUpdate(
      { _id },
      { $set: { status } },
      { new: true },
    ).lean();

    if (!assignment) {
      throw new Error(`Unit assignment "${_id}" not found`);
    }

    return assignment;
  },

  blockAgencyRemoveUnit: async (
    _root: undefined,
    { _id }: { _id: string },
    { models, user }: IContext,
  ) => {
    checkLogin(user);

    const result = await models.BlockUnitAssignment.findOneAndDelete({ _id });
    return !!result;
  },
};
