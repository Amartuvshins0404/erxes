import {
  IOffer,
  IOfferInput,
  OfferStatus,
} from '@/contract/@types/offer';
import { InvoiceItemType, InvoiceStatus } from '@/invoice/@types/invoice';
import {
  BlockProjectPaymentPlanFrequency,
  BlockProjectPaymentPlanInterestType,
} from '@/project/@types/payment';
import { IContext } from '~/connectionResolvers';

function stripNulls<T extends Record<string, any>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== null && v !== undefined),
  ) as Partial<T>;
}

export const offerMutations = {
  blockCreateOffer: async (
    _parent: undefined,
    { input }: { input: IOfferInput },
    { models }: IContext,
  ) => {
    const { invoices, ...rest } = input;
    if (rest.paymentPlan) {
      rest.paymentPlan = stripNulls(rest.paymentPlan) as typeof rest.paymentPlan;
    }

    const unit = await models.Unit.findOne({ _id: input.unit });

    if (!unit) {
      throw new Error('Unit not found');
    }


    const existingCount = await models.Offer.countDocuments({ unit: input.unit });
    const number = `${unit.number}-${(existingCount + 1).toString().padStart(3, '0')}`;

    rest.number = number;
    rest.project = rest.project || (unit as any).project;

    const unitType = await models.UnitType.findOne({ _id: unit.type });

    if (!unitType) {
      throw new Error('Unit type not found');
    }

    const offer = await models.Offer.createOffer(rest);

    let totalAmount = input.amount * unitType.size;

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
      return models.Invoice.createInvoice({
        amount: totalAmount - downPaymentAmount,
        date: completionPaymentDate || new Date(),
        status: InvoiceStatus.UNPAID,
        number: downPaymentPercentage ? 2 : 1,
        itemId: offer._id,
        itemType: InvoiceItemType.OFFER,
        description: downPaymentPercentage ? 'Remaining amount' : 'Full amount',
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

    return offer;
  },

  blockUpdateOffer: async (
    _parent: undefined,
    { _id, input }: { _id: string; input: IOffer },
    { models }: IContext,
  ) => {
    if (input.paymentPlan) {
      input.paymentPlan = stripNulls(input.paymentPlan) as typeof input.paymentPlan;
    }
    return models.Offer.updateOffer(_id, input);
  },

  blockSendOfferEmail: async (
    _parent: undefined,
    { _id }: { _id: string },
    { models }: IContext,
  ) => {
    await models.Offer.updateOne(
      { _id },
      { $set: { status: OfferStatus.SENT } },
    );
    return 'success';
  },
};

