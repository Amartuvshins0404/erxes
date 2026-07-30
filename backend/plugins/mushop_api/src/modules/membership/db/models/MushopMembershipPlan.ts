import { Model } from 'mongoose';
import { EventDispatcherReturn } from 'erxes-api-shared/core-modules';
import { IModels } from '~/connectionResolvers';
import { mushopMembershipPlanSchema } from '@/membership/db/definitions/mushopMembershipPlan';
import { IMushopMembershipPlanDocument } from '@/membership/@types/mushopMembershipPlan';
import {
  buildPlanCreatedLog,
  buildPlanUpdatedLog,
  buildPlanDeactivatedLog,
} from '~/meta/activity-log/mushopMembershipPlan';

export interface IMushopMembershipPlanModel
  extends Model<IMushopMembershipPlanDocument> {
  validateAndGet(
    planId: string,
    paidAmount: number,
    paidCurrency: string,
  ): Promise<IMushopMembershipPlanDocument>;
  createPlan(doc: {
    name: string;
    description?: string;
    price: number;
    currency?: string;
    durationMonths?: number;
  }): Promise<IMushopMembershipPlanDocument>;
  updatePlan(
    _id: string,
    doc: Partial<IMushopMembershipPlanDocument>,
  ): Promise<IMushopMembershipPlanDocument | null>;
  deactivatePlan(_id: string): Promise<IMushopMembershipPlanDocument | null>;
}

export const loadMushopMembershipPlanClass = (
  models: IModels,
  { createActivityLog }: EventDispatcherReturn,
) => {
  class MushopMembershipPlan {
    public static async validateAndGet(
      planId: string,
      paidAmount: number,
      paidCurrency: string,
    ) {
      const plan = await models.MembershipPlan.findOne({
        _id: planId,
        isActive: true,
      }).lean();

      if (!plan) throw new Error(`Plan ${planId} not found or inactive`);

      if (plan.currency !== paidCurrency) {
        throw new Error(
          `Currency mismatch: plan expects ${plan.currency}, got ${paidCurrency}`,
        );
      }

      if (paidAmount < plan.price) {
        throw new Error(
          `Insufficient payment: plan requires ${plan.price} ${plan.currency}, got ${paidAmount}`,
        );
      }

      return plan;
    }

    public static async createPlan(doc: {
      name: string;
      description?: string;
      price: number;
      currency?: string;
      durationMonths?: number;
    }) {
      const plan = await models.MembershipPlan.create({
        ...doc,
        isActive: true,
      });

      createActivityLog(buildPlanCreatedLog(plan));

      return plan;
    }

    public static async updatePlan(
      _id: string,
      doc: Partial<IMushopMembershipPlanDocument>,
    ) {
      const prev = await models.MembershipPlan.findOne({ _id }).lean();
      if (!prev) throw new Error(`Plan ${_id} not found`);

      const updated = await models.MembershipPlan.findOneAndUpdate(
        { _id },
        { $set: doc },
        { new: true },
      );

      if (updated) {
        createActivityLog(
          buildPlanUpdatedLog(updated, {
            name: prev.name,
            price: prev.price,
            currency: prev.currency,
            durationMonths: prev.durationMonths,
            description: prev.description,
          }),
        );
      }

      return updated;
    }

    public static async deactivatePlan(_id: string) {
      const updated = await models.MembershipPlan.findOneAndUpdate(
        { _id },
        { $set: { isActive: false } },
        { new: true },
      );

      if (updated) {
        createActivityLog(buildPlanDeactivatedLog(updated));
      }

      return updated;
    }
  }

  mushopMembershipPlanSchema.loadClass(MushopMembershipPlan);
  return mushopMembershipPlanSchema;
};
