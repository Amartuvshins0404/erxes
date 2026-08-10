import { Model } from 'mongoose';
import { IModels } from '~/connectionResolvers';
import { baMembershipSchema } from '@/membership/db/definitions/membership';
import { IBaMembershipDocument } from '@/membership/@types/membership';
import { MEMBERSHIP_STATUS } from '@/membership/constants';

export interface IBaMembershipModel extends Model<IBaMembershipDocument> {
  getActiveMembership(
    customerId: string,
  ): Promise<IBaMembershipDocument | null>;
  getOpenMembership(customerId: string): Promise<IBaMembershipDocument | null>;
  createMembership(doc: {
    customerId: string;
    planId: string;
    amount: number;
    currency: string;
    invoiceId: string;
  }): Promise<IBaMembershipDocument>;
  renewMembership(
    _id: string,
    doc: {
      planId: string;
      amount: number;
      currency: string;
      invoiceId: string;
    },
  ): Promise<IBaMembershipDocument | null>;
  cancelMembership(_id: string): Promise<IBaMembershipDocument | null>;
  updateEndDate(
    _id: string,
    endDate: Date,
  ): Promise<IBaMembershipDocument | null>;
  updateStatus(
    _id: string,
    status: string,
  ): Promise<IBaMembershipDocument | null>;
  expireIfStale(_id: string): Promise<IBaMembershipDocument | null>;
  expireStale(): Promise<void>;
}

const addMonths = (date: Date, months: number): Date => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

export const loadBaMembershipClass = (models: IModels) => {
  class BaMembership {
    public static async getActiveMembership(customerId: string) {
      const membership = await models.Membership.findOne({
        customerId,
        status: MEMBERSHIP_STATUS.ACTIVE,
      }).lean();

      if (membership && membership.endDate < new Date()) {
        await models.Membership.updateOne(
          { _id: membership._id },
          { $set: { status: MEMBERSHIP_STATUS.EXPIRED } },
        );
        return null;
      }

      return membership;
    }

    // any non-terminal membership (active) — used so a new grant reuses it
    // instead of creating a parallel duplicate row
    public static async getOpenMembership(customerId: string) {
      return models.Membership.findOne({
        customerId,
        status: { $in: [MEMBERSHIP_STATUS.ACTIVE] },
      })
        .sort({ endDate: -1 })
        .lean();
    }

    public static async createMembership(doc: {
      customerId: string;
      planId: string;
      amount: number;
      currency: string;
      invoiceId: string;
    }) {
      const plan = await models.MembershipPlan.validateAndGet(
        doc.planId,
        doc.amount,
        doc.currency,
      );

      const startDate = new Date();
      const endDate = addMonths(startDate, plan.durationMonths);

      return models.Membership.create({
        ...doc,
        status: MEMBERSHIP_STATUS.ACTIVE,
        startDate,
        endDate,
      });
    }

    public static async renewMembership(
      _id: string,
      doc: {
        planId: string;
        amount: number;
        currency: string;
        invoiceId: string;
      },
    ) {
      const existing = await models.Membership.findOne({ _id });
      if (!existing) throw new Error('Membership not found');

      const plan = await models.MembershipPlan.validateAndGet(
        doc.planId,
        doc.amount,
        doc.currency,
      );

      const base =
        existing.endDate > new Date() ? existing.endDate : new Date();
      const newEndDate = addMonths(base, plan.durationMonths);

      return models.Membership.findOneAndUpdate(
        { _id },
        {
          $set: {
            endDate: newEndDate,
            planId: doc.planId,
            invoiceId: doc.invoiceId,
          },
        },
        { new: true },
      );
    }

    public static async cancelMembership(_id: string) {
      return models.Membership.findOneAndUpdate(
        { _id },
        { $set: { status: MEMBERSHIP_STATUS.CANCELLED } },
        { new: true },
      );
    }

    public static async updateEndDate(_id: string, endDate: Date) {
      const existing = await models.Membership.findOne({ _id });
      if (!existing) throw new Error('Membership not found');

      const newEndDate = new Date(endDate);
      if (isNaN(newEndDate.getTime())) throw new Error('Invalid end date');

      if (newEndDate <= existing.startDate) {
        throw new Error('End date must be after the start date');
      }

      const update: Record<string, any> = { endDate: newEndDate };

      // keep status consistent with the new end date
      if (
        existing.status === MEMBERSHIP_STATUS.ACTIVE &&
        newEndDate < new Date()
      ) {
        update.status = MEMBERSHIP_STATUS.EXPIRED;
      } else if (
        existing.status === MEMBERSHIP_STATUS.EXPIRED &&
        newEndDate > new Date()
      ) {
        update.status = MEMBERSHIP_STATUS.ACTIVE;
      }

      return models.Membership.findOneAndUpdate(
        { _id },
        { $set: update },
        { new: true },
      );
    }

    public static async updateStatus(_id: string, status: string) {
      if (!MEMBERSHIP_STATUS.ALL.includes(status)) {
        throw new Error(`Invalid status: ${status}`);
      }

      const existing = await models.Membership.findOne({ _id });
      if (!existing) throw new Error('Membership not found');

      if (existing.status === status) {
        return existing;
      }

      if (status === MEMBERSHIP_STATUS.ACTIVE) {
        if (existing.endDate < new Date()) {
          throw new Error(
            'Cannot set status to active because the end date has already passed. Extend the end date first.',
          );
        }
      }

      return models.Membership.findOneAndUpdate(
        { _id },
        { $set: { status } },
        { new: true },
      );
    }

    public static async expireIfStale(_id: string) {
      const membership = await models.Membership.findOne({ _id }).lean();

      if (!membership) return null;

      if (
        membership.status === MEMBERSHIP_STATUS.ACTIVE &&
        membership.endDate < new Date()
      ) {
        await models.Membership.updateOne(
          { _id: membership._id },
          { $set: { status: MEMBERSHIP_STATUS.EXPIRED } },
        );
        return { ...membership, status: MEMBERSHIP_STATUS.EXPIRED };
      }

      return membership;
    }

    public static async expireStale() {
      await models.Membership.updateMany(
        { status: MEMBERSHIP_STATUS.ACTIVE, endDate: { $lt: new Date() } },
        { $set: { status: MEMBERSHIP_STATUS.EXPIRED } },
      );
    }
  }

  baMembershipSchema.loadClass(BaMembership);
  return baMembershipSchema;
};
