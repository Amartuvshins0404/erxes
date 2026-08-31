import { Router } from 'express';

import { IMeetingSyncInput } from '@/meeting/@types/meeting';
import { IModels } from '~/connectionResolvers';
import { IWebhookRequest, IWebhookResponse } from '~/types';

const router: Router = Router();

router.post(
  '/syncMeeting',
  async (req: IWebhookRequest<IMeetingSyncInput>, res: IWebhookResponse) => {
    const { models } = res.locals as { models: IModels };
    const { payload } = req.body || {};
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
      const meeting = await models.Meeting.syncMeeting(entityId, data.input);

      return res.status(200).json({ success: true, _id: meeting?._id });
    } catch (error) {
      return res.status(400).json({ message: (error as Error).message });
    }
  },
);

router.post(
  '/removeMeeting',
  async (req: IWebhookRequest<never>, res: IWebhookResponse) => {
    const { models } = res.locals as { models: IModels };
    const { payload } = req.body || {};
    const { entityId } = payload || {};

    if (!entityId) {
      return res.status(400).json({ message: 'payload.entityId is required' });
    }

    try {
      const { deletedCount } = await models.Meeting.removeSyncedMeeting(
        entityId,
      );

      return res.status(200).json({ success: true, deletedCount });
    } catch (error) {
      return res.status(400).json({ message: (error as Error).message });
    }
  },
);

export { router };
