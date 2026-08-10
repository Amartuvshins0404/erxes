import { Router, Request, Response } from 'express';
import { generateModels, IModels } from '~/connectionResolvers';
import { ConsumerPlatform } from '~/modules/platform/shared';
import { SUPPLIER_VERIFICATION_STATUS } from '~/constants';

const router: Router = Router();

const ALLOWED_PLATFORMS: ConsumerPlatform[] = ['mushop', 'blockadmin'];


interface PlatformWebhookCtx<TData = any> {
  platform: ConsumerPlatform;
  subdomain: string;
  entityId: string;
  data: TData;
  models: IModels;
}

const handlePlatformWebhook = async <TData = any>(
  req: Request,
  res: Response,
  validate: (ctx: PlatformWebhookCtx<TData>) => string | null | undefined,
  handler: (ctx: PlatformWebhookCtx<TData>) => Promise<void>,
): Promise<Response> => {
  try {
    const platform = req.params.platform as ConsumerPlatform;

    if (!ALLOWED_PLATFORMS.includes(platform)) {
      return res.status(400).json({ error: `Unknown platform: ${platform}` });
    }

    const { subdomain, payload } = req.body || {};
    const { entityId, data } = payload || {};

    if (!subdomain) {
      return res.status(400).json({ error: 'subdomain is required' });
    }
    if (!entityId) {
      return res.status(400).json({ error: 'payload.entityId is required' });
    }

    const models = await generateModels(subdomain);
    const ctx: PlatformWebhookCtx<TData> = {
      platform,
      subdomain,
      entityId,
      data: (data || {}) as TData,
      models,
    };

    const validationError = validate(ctx);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    await handler(ctx);
    return res.status(200).json({ success: true });
  } catch (e: any) {
    console.error('platform webhook failed:', e);
    return res.status(400).json({ error: e.message });
  }
};

router.post('/:platform/supplier', (req, res) =>
  handlePlatformWebhook<{ verificationStatus?: string; note?: string }>(
    req,
    res,
    ({ data }) => {
      if (!data.verificationStatus) {
        return 'payload.data.verificationStatus is required';
      }
      if (!SUPPLIER_VERIFICATION_STATUS.ALL.includes(data.verificationStatus)) {
        return `Invalid verificationStatus: ${data.verificationStatus}`;
      }
      return null;
    },
    async ({ entityId, data, models }) => {
      await models.Supplier.updateVerificationStatus(
        entityId,
        data.verificationStatus!,
        data.note,
      );
    },
  ),
);

export { router };
