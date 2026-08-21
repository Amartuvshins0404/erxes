import { Model } from 'mongoose';
import { IModels } from '~/connectionResolvers';
import { blockAgencyMemberSchema } from '~/modules/member/db/definitions/member';
import {
  IBlockAgencyAddMembersInput,
  IBlockAgencyMember,
  IBlockAgencyMemberDocument,
} from '~/modules/member/@types/member';

export interface IBlockAgencyMemberModel extends Model<IBlockAgencyMemberDocument> {
  getMember(_id: string): Promise<IBlockAgencyMemberDocument | null>;
  createMember(
    members: IBlockAgencyAddMembersInput[],
  ): Promise<IBlockAgencyMemberDocument[]>;
  updateMember(
    _id: string,
    input: Partial<IBlockAgencyMember>,
  ): Promise<IBlockAgencyMemberDocument>;
  updateProfile(
    memberId: string,
    input: Partial<IBlockAgencyMember>,
  ): Promise<IBlockAgencyMemberDocument>;
  removeMember(_id: string): Promise<void>;
}

export const loadBlockAgencyMemberClass = (_models: IModels) => {
  class BlockAgencyMember {
    public static async getMember(_id: string) {
      return _models.BlockAgencyMember.findById(_id).lean();
    }

    public static async createMember(members: IBlockAgencyAddMembersInput[]) {
      return _models.BlockAgencyMember.insertMany(members);
    }

    public static async updateMember(
      _id: string,
      input: Partial<IBlockAgencyMember>,
    ) {
      return _models.BlockAgencyMember.findOneAndUpdate(
        { _id },
        { $set: input },
        { new: true },
      );
    }

    public static async updateProfile(
      memberId: string,
      input: Partial<IBlockAgencyMember>,
    ) {
      return _models.BlockAgencyMember.findOneAndUpdate(
        { memberId },
        { $set: input, $setOnInsert: { memberId } },
        { new: true, upsert: true },
      );
    }

    public static async removeMember(_id: string) {
      await _models.BlockAgencyMember.deleteOne({ _id });
    }
  }

  blockAgencyMemberSchema.loadClass(BlockAgencyMember);

  return blockAgencyMemberSchema;
};
