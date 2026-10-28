import { IContext } from '~/connectionResolvers';
import { IBoardDocument } from '~/modules/sales/@types';
import {
  getContainerAccessFilter,
  PIPELINE_MEMBER_FIELDS,
} from '~/modules/sales/utils/structureAccess';

export default {
  async pipelines(
    board: IBoardDocument,
    _args: undefined,
    { user, models, subdomain }: IContext,
  ) {
    if (board.pipelines) {
      return board.pipelines;
    }

    if (!user) {
      return models.Pipelines.find({
        boardId: board._id,
        status: { $ne: 'archived' },
        visibility: 'public',
      }).lean();
    }

    if (user.isOwner) {
      return models.Pipelines.find({
        boardId: board._id,
        status: { $ne: 'archived' },
      }).lean();
    }

    const accessFilter = await getContainerAccessFilter(
      subdomain,
      user,
      PIPELINE_MEMBER_FIELDS,
    );

    return models.Pipelines.find({
      $and: [
        { status: { $ne: 'archived' } },
        { boardId: board._id },
        accessFilter,
      ],
    }).lean();
  },
};
