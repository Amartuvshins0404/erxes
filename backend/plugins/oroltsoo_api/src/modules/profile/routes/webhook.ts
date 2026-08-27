import { Router } from 'express';

import { IProfileReview } from '@/profile/@types/profile';
import { IModels } from '~/connectionResolvers';
import { IWebhookRequest, IWebhookResponse } from '~/types';

const router: Router = Router();

router.post(
  '/syncReviewStatus',
  async (req: IWebhookRequest<IProfileReview>, res: IWebhookResponse) => {
    const { models } = res.locals as { models: IModels };
    const { payload } = req.body || {};
    const { entityId, data } = payload || {};

    if (!entityId) {
      return res.status(400).json({ message: 'payload.entityId is required' });
    }

    if (!data?.input?.reviewStatus) {
      return res
        .status(400)
        .json({ message: 'payload.data.input.reviewStatus is required' });
    }

    try {
      const profile = await models.Profile.applyReview(entityId, data.input);

      if (!profile) {
        return res.status(404).json({ message: 'Profile not found' });
      }

      return res.status(200).json({ success: true, _id: profile._id });
    } catch (error) {
      return res.status(400).json({ message: (error as Error).message });
    }
  },
);

export { router };
