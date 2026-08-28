import { getSubdomain } from 'erxes-api-shared/utils';
import { Router } from 'express';
import { createContractPaymentInvoice } from '@/contract/utils/onlinePayment';
import { generateModels } from '~/connectionResolvers';
import { IRequest, IResponse } from '~/types';

const router: Router = Router();

// blockadmin_api calls this on behalf of a client-portal customer who wants to
// settle a scheduled payment online. The invoice is created in THIS org's
// payment plugin, so the money lands in the org's own QPay merchant account and
// payment_api routes the paid-invoice callback straight back to block_api.
router.post(
  '/createContractPaymentInvoice',
  async (
    req: IRequest<{
      amount?: number;
      cpUserId?: string;
      email?: string;
      phone?: string;
      redirectUri?: string;
    }>,
    res: IResponse,
  ) => {
    const subdomain = getSubdomain(req);
    const models = await generateModels(subdomain);

    try {
      const { payload } = req.body || {};

      const { entityId, data } = payload || {};

      if (!entityId) {
        return res.status(400).json({ error: 'Payment id is required' });
      }

      const invoice = await createContractPaymentInvoice({
        models,
        subdomain,
        paymentId: entityId,
        amount: data?.amount,
        cpUserId: data?.cpUserId,
        email: data?.email,
        phone: data?.phone,
        redirectUri: data?.redirectUri,
      });

      return res.status(200).json({
        success: true,
        invoice,
      });
    } catch (error) {
      return res.status(400).json({
        error: error.message,
      });
    }
  },
);

export { router };
