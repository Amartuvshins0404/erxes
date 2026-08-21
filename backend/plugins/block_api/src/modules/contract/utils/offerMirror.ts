import { IOffer, IOfferDocument } from '@/contract/@types/offer';

// Unlike Contract's status (a per-org ContractStatus reference), Offer's
// status is already a plain 'draft'|'sent' string on both sides, so no
// resolve-to-semantic-type step is needed before mirroring.
export const buildOfferMirrorInput = (offer: IOfferDocument): IOffer => ({
  number: offer.number,
  unit: offer.unit,
  project: offer.project,
  date: offer.date,
  amount: offer.amount,
  currency: offer.currency,
  status: offer.status,
  endDate: offer.endDate,
  customerId: offer.customerId,
  paymentPlan: offer.paymentPlan,
  user: offer.user,
  description: offer.description,
});
