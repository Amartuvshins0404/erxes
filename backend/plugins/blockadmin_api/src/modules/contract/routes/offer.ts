import { Router } from 'express';
import { IContext } from '~/connectionResolvers';
import {
  IInvoice,
  InvoiceItemType,
  InvoiceStatus,
} from '~/modules/invoice/@types/invoice';
import {
  BlockProjectPaymentPlanFrequency,
  BlockProjectPaymentPlanInterestType,
} from '~/modules/project/@types/payment';
import { IRequest, IResponse } from '~/types';
import { IOffer, OfferAmountType, OfferStatus } from '../@types/offer';
import { CONTRACT_STATUS } from '../constants';

const router: Router = Router();

router.post(
  '/blockCreateOffer',
  async (req: IRequest<IOffer & { invoices: IInvoice[] }>, res: IResponse) => {
    const { models } = res.locals as IContext;

    try {
      const { subdomain, payload } = req.body || {};

      const { entityId, data } = payload || {};

      const { input } = data || {};

      const { invoices, ...rest } = input;

      const number = Math.floor(Math.random() * 1000000).toString();

      rest.number = number;

      const contract = await models.Contract.findOne({
        unit: input.unit,
        status: CONTRACT_STATUS.SIGNED,
      });

      const paymentPlan = input.paymentPlan;

      if (contract) {
        throw new Error('Can not create offer because contract is signed');
      }

      const unit = await models.Unit.findOne({ _id: input.unit });

      if (!unit) {
        throw new Error('Unit not found');
      }

      const unitType = await models.UnitType.findOne({ _id: unit?.type });

      if (!unitType || !unitType.size) {
        throw new Error('Unit type not found');
      }

      const offer = await models.Offer.createOffer(rest);

      let totalAmount =
        input.amountType === OfferAmountType.PER_SIZE
          ? input.amount * unitType.size
          : input.amount;

      const {
        frequency,
        discountPercentage,
        downPaymentPercentage,
        completionPaymentDate,
        installment,
        interestPercentage,
        interestType,
      } = rest.paymentPlan;

      if (discountPercentage && discountPercentage > 0) {
        const discountAmount = Math.round(
          totalAmount * (discountPercentage / 100),
        );

        totalAmount -= discountAmount;
      }

      let downPaymentAmount = 0;

      if (downPaymentPercentage && downPaymentPercentage > 0) {
        downPaymentAmount = Math.round(
          totalAmount * (downPaymentPercentage / 100),
        );
      }

      if (downPaymentPercentage) {
        await models.Invoice.createInvoice({
          subdomain,
          entityId,
          amount: downPaymentAmount,
          date: completionPaymentDate || new Date(),
          status: InvoiceStatus.UNPAID,
          number: 1,
          itemId: offer._id,
          itemType: InvoiceItemType.OFFER,
          description: 'Down payment',
        });
      }

      if (frequency === BlockProjectPaymentPlanFrequency.ONE_TIME) {
        await models.Invoice.createInvoice({
          subdomain,
          entityId,
          amount: totalAmount - downPaymentAmount,
          date: completionPaymentDate || new Date(),
          status: InvoiceStatus.UNPAID,
          number: downPaymentPercentage ? 2 : 1,
          itemId: offer._id,
          itemType: InvoiceItemType.OFFER,
          description: downPaymentPercentage
            ? 'Remaining amount'
            : 'Full amount',
        });
      }

      if (installment && installment > 0) {
        const currentDate = completionPaymentDate || new Date();
        const addMonths = (date: Date, months: number) => {
          const d = new Date(date);
          d.setMonth(d.getMonth() + months);
          return d;
        };

        const principal = totalAmount - downPaymentAmount;
        const baseInstallment = Math.round(principal / installment);

        for (let i = 0; i < installment; i++) {
          const dueDate = addMonths(currentDate, i);

          let interestAmount = 0;

          if (interestPercentage && interestPercentage > 0) {
            switch (interestType) {
              case 'SIMPLE':
                interestAmount = Math.round(
                  principal * (interestPercentage / 100),
                );
                break;

              case BlockProjectPaymentPlanInterestType.FLAT: {
                const totalFlatInterest = Math.round(
                  principal * (interestPercentage / 100),
                );
                interestAmount = Math.round(totalFlatInterest / installment);
                break;
              }

              case 'REDUCING': {
                const remaining = principal - baseInstallment * i;
                interestAmount = Math.round(
                  remaining * (interestPercentage / 100),
                );
                break;
              }
            }
          }

          await models.Invoice.createInvoice({
            subdomain,
            entityId,
            amount: baseInstallment + interestAmount,
            date: dueDate,
            status: InvoiceStatus.UNPAID,
            number: i + 1,
            itemId: offer._id,
            itemType: InvoiceItemType.OFFER,
            description: `Installment ${i + 1} (${interestType} Interest ${
              interestPercentage || 0
            }%)`,
          });
        }

        return offer;
      }

      models.Offer.createOffer(rest);

      return res.status(200).json({
        success: true,
      });
    } catch (error) {
      return res.status(400).json({
        error: error.message,
      });
    }
  },
);

router.post(
  '/blockUpdateOffer',
  async (req: IRequest<IOffer>, res: IResponse) => {
    const { models } = res.locals as IContext;

    try {
      const { subdomain, payload } = req.body || {};

      const { entityId, data } = payload || {};

      const { input } = data || {};

      models.Offer.updateOffer(subdomain, entityId, input);

      return res.status(200).json({
        success: true,
      });
    } catch (error) {
      return res.status(400).json({
        error: error.message,
      });
    }
  },
);

router.post(
  '/blockSendOfferEmail',
  async (req: IRequest<IOffer>, res: IResponse) => {
    const { models } = res.locals as IContext;

    try {
      const { subdomain, payload } = req.body || {};

      const { entityId } = payload || {};

      models.Offer.updateOffer(subdomain, entityId, {
        status: OfferStatus.SENT,
      } as IOffer);

      return res.status(200).json({
        success: true,
      });
    } catch (error) {
      return res.status(400).json({
        error: error.message,
      });
    }
  },
);

export { router };
