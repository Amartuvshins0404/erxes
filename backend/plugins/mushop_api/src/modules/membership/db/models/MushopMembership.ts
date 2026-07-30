import { Model } from 'mongoose';
import { EventDispatcherReturn } from 'erxes-api-shared/core-modules';
import { IModels } from '~/connectionResolvers';
import { mushopMembershipSchema } from '@/membership/db/definitions/mushopMembership';
import { IMushopMembershipDocument } from '@/membership/@types/mushopMembership';
import { MEMBERSHIP_STATUS } from '~/constants';
import {
  buildMembershipCreatedLog,
  buildMembershipExtendedLog,
  buildMembershipCancelledLog,
  buildMembershipExpiredLog,
  buildMembershipEndDateAdjustedLog,
  buildMembershipStatusChangedLog,
} from '~/meta/activity-log/mushopMembership';

export interface IMushopMembershipModel
  extends Model<IMushopMembershipDocument> {
  getActiveMembership(
    customerId: string,
  ): Promise<IMushopMembershipDocument | null>;
  getOpenMembership(
    customerId: string,
  ): Promise<IMushopMembershipDocument | null>;
  createMembership(doc: {
    customerId: string;
    planId: string;
    amount: number;
    currency: string;
    invoiceId: string;
  }): Promise<IMushopMembershipDocument>;
  renewMembership(
    _id: string,
    doc: { planId: string; amount: number; currency: string; invoiceId: string },
  ): Promise<IMushopMembershipDocument | null>;
  cancelMembership(_id: string): Promise<IMushopMembershipDocument | null>;
  updateEndDate(
    _id: string,
    endDate: Date,
  ): Promise<IMushopMembershipDocument | null>;
  updateStatus(
    _id: string,
    status: string,
  ): Promise<IMushopMembershipDocument | null>;
  expireStale(): Promise<void>;
}

const addMonths = (date: Date, months: number): Date => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const addDays = (date: Date, days: number): Date =>
  new Date(date.getTime() + days * MS_PER_DAY);

// whole days remaining until `endDate` from now (min 1 so a near-expiry pause keeps at least a day)
const daysUntil = (endDate: Date): number =>
  Math.max(1, Math.ceil((endDate.getTime() - Date.now()) / MS_PER_DAY));

export const loadMushopMembershipClass = (
  models: IModels,
  { createActivityLog }: EventDispatcherReturn,
) => {
  class MushopMembership {
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
        const plan = membership.planId
          ? await models.MembershipPlan.findOne({ _id: membership.planId }).lean()
          : null;
        createActivityLog(buildMembershipExpiredLog(membership, plan?.name || 'Unknown'));
        return null;
      }

      return membership;
    }

    // any non-terminal membership (active / paused / suspended) — used so a
    // new grant reuses it instead of creating a parallel duplicate row
    public static async getOpenMembership(customerId: string) {
      return models.Membership.findOne({
        customerId,
        status: {
          $in: [
            MEMBERSHIP_STATUS.ACTIVE,
          ],
        },
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

      const sub = await models.Membership.create({
        ...doc,
        status: MEMBERSHIP_STATUS.ACTIVE,
        startDate,
        endDate,
      });

      createActivityLog(buildMembershipCreatedLog(sub, plan.name));

      return sub;
    }

    public static async renewMembership(
      _id: string,
      doc: { planId: string; amount: number; currency: string; invoiceId: string },
    ) {
      const existing = await models.Membership.findOne({ _id });
      if (!existing) throw new Error('Membership not found');

      const plan = await models.MembershipPlan.validateAndGet(
        doc.planId,
        doc.amount,
        doc.currency,
      );

      const prevEndDate = existing.endDate;
      const base = existing.endDate > new Date() ? existing.endDate : new Date();
      const newEndDate = addMonths(base, plan.durationMonths);

      const updated = await models.Membership.findOneAndUpdate(
        { _id },
        { $set: { endDate: newEndDate, planId: doc.planId, invoiceId: doc.invoiceId } },
        { new: true },
      );

      if (updated) {
        createActivityLog(buildMembershipExtendedLog(updated, plan.name, prevEndDate));
      }

      return updated;
    }

    public static async cancelMembership(_id: string) {
      const updated = await models.Membership.findOneAndUpdate(
        { _id },
        { $set: { status: MEMBERSHIP_STATUS.CANCELLED } },
        { new: true },
      );

      if (updated) {
        const plan = updated.planId
          ? await models.MembershipPlan.findOne({ _id: updated.planId }).lean()
          : null;
        createActivityLog(buildMembershipCancelledLog(updated, plan?.name || 'Unknown'));
      }

      return updated;
    }

    public static async updateEndDate(_id: string, endDate: Date) {
      const existing = await models.Membership.findOne({ _id });
      if (!existing) throw new Error('Membership not found');

      const newEndDate = new Date(endDate);
      if (isNaN(newEndDate.getTime())) throw new Error('Invalid end date');

      if (newEndDate <= existing.startDate) {
        throw new Error('End date must be after the start date');
      }

      const prevEndDate = existing.endDate;

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

      const updated = await models.Membership.findOneAndUpdate(
        { _id },
        { $set: update },
        { new: true },
      );

      if (updated) {
        const plan = updated.planId
          ? await models.MembershipPlan.findOne({
              _id: updated.planId,
            }).lean()
          : null;
        createActivityLog(
          buildMembershipEndDateAdjustedLog(
            updated,
            plan?.name || 'Unknown',
            prevEndDate,
          ),
        );
      }

      return updated;
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

      const updated = await models.Membership.findOneAndUpdate(
        { _id },
        { $set: { status } },
        { new: true },
      );

      if (updated) {
        const plan = await models.MembershipPlan.findOne({ _id: updated.planId }).lean()

        createActivityLog(
          buildMembershipStatusChangedLog(
            updated,
            plan?.name || 'Unknown',
            existing.status,
          ),
        );
      }

      return updated;
    }

    public static async expireStale() {
      const stale = await models.Membership.find({
        status: MEMBERSHIP_STATUS.ACTIVE,
        endDate: { $lt: new Date() },
      }).lean();

      await models.Membership.updateMany(
        { status: MEMBERSHIP_STATUS.ACTIVE, endDate: { $lt: new Date() } },
        { $set: { status: MEMBERSHIP_STATUS.EXPIRED } },
      );

      for (const sub of stale) {
        const plan = sub.planId
          ? await models.MembershipPlan.findOne({ _id: sub.planId }).lean()
          : null;
        createActivityLog(buildMembershipExpiredLog(sub, plan?.name || 'Unknown'));
      }
    }
  }

  mushopMembershipSchema.loadClass(MushopMembership);
  return mushopMembershipSchema;
};
