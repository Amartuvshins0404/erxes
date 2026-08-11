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
import { sendMessageAwait, syncCustomerToBlockAdmin } from '@/admin/utils';
import { buildOfferMirrorInput } from '@/contract/utils/offerMirror';

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

    if (unit.locked) {
      throw new Error('Cannot create offer: unit is locked');
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
    args: { _id: string; input?: IOffer },
    { models }: IContext,
  ) => {
    const updated = await models.Offer.updateOffer(args._id, {
      status: OfferStatus.SENT,
    } as IOffer);

    // blockSendOfferEmail's own args shape ({_id}) carries no offer fields,
    // so reshape the mirrored payload to what block-admin's webhook route
    // expects (matching blockUpdateContractStatus's pattern for Contract).
    if (updated) {
      args.input = buildOfferMirrorInput(updated);
    }

    return updated;
  },

  // Manual re-sync for a single offer: on-demand version of the automatic
  // sent-offer mirror, for use from a UI-triggered "sync" action.
  blockManualSyncOffer: async (
    _parent: undefined,
    { offerId }: { offerId: string },
    { models, subdomain }: IContext & { subdomain: string },
  ) => {
    const offer = await models.Offer.getOffer(offerId);

    if (!offer) {
      throw new Error('Offer not found');
    }

    if (offer.status !== OfferStatus.SENT) {
      throw new Error('Only sent offers can be synced to Block Platform');
    }

    if (offer.customerId) {
      await syncCustomerToBlockAdmin(subdomain, offer.customerId, models);
    }

    const response = await sendMessageAwait({
      subdomain,
      path: 'blockUpdateOffer',
      payload: {
        entityId: offer._id,
        data: {
          input: buildOfferMirrorInput(offer),
        },
      },
    });

    if (response?.error) {
      throw new Error(response.error);
    }

    return offer;
  },
};

