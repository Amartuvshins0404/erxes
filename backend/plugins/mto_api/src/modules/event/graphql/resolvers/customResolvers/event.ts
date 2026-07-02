import { IEventDocument } from '@/event/@types/event';
import { IContext } from '~/connectionResolvers';

const eventCustomResolvers = {
  MtoEvent: {
    categories: async (
      event: IEventDocument,
      _params: undefined,
      { models }: IContext,
    ) => {
      const ids = event.categoryIds ?? [];

      if (!ids.length) {
        return [];
      }

      return models.Association.find({ _id: { $in: ids } });
    },
  },
};

export default eventCustomResolvers;
