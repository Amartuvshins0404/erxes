import { Router } from 'express';

import { IProfileSyncInput } from '@/profile/@types/profile';
import { IModels } from '~/connectionResolvers';
import { IWebhookRequest, IWebhookResponse } from '~/types';

const router: Router = Router();

router.post(
  '/syncProfile',
  async (
    req: IWebhookRequest<IProfileSyncInput>,
    res: IWebhookResponse,
  ) => {
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
      const profile = await models.Profile.syncProfile(
        subdomain,
        entityId,
        data.input,
      );

      return res.status(200).json({ success: true, _id: profile?._id });
    } catch (error) {
      return res.status(400).json({ message: (error as Error).message });
    }
  },
);


export { router };
