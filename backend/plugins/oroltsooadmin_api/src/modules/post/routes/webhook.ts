import { Router } from 'express';

import { IPostSyncInput } from '@/post/@types/post';
import { IModels } from '~/connectionResolvers';
import { IWebhookRequest, IWebhookResponse } from '~/types';

const router: Router = Router();

router.post(
  '/syncPost',
  async (req: IWebhookRequest<IPostSyncInput>, res: IWebhookResponse) => {
    const { models } = res.locals as { models: IModels };
    const { subdomain, payload } = req.body || {};
    const { entityId, data } = payload || {};

    if (!entityId) {
      return res.status(400).json({ message: 'payload.entityId is required' });
    }

    if (!data?.input) {
      return res
        .status(400)
        .json({ message: 'payload.data.input is required' });
    }

    try {
      const post = await models.Post.syncPost(subdomain, entityId, data.input);

      return res.status(200).json({ success: true, _id: post?._id });
    } catch (error) {
      return res.status(400).json({ message: (error as Error).message });
    }
  },
);

router.post(
  '/removePost',
  async (req: IWebhookRequest<never>, res: IWebhookResponse) => {
    const { models } = res.locals as { models: IModels };
    const { subdomain, payload } = req.body || {};
    const { entityId } = payload || {};

    if (!entityId) {
      return res.status(400).json({ message: 'payload.entityId is required' });
    }

    try {
      const { deletedCount } = await models.Post.removeSyncedPost(
        subdomain,
        entityId,
      );

      return res.status(200).json({ success: true, deletedCount });
    } catch (error) {
      return res.status(400).json({ message: (error as Error).message });
    }
  },
);

export { router };
