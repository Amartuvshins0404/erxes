import { Model } from 'mongoose';
import { IModels } from '~/connectionResolvers';
import { baMembershipPlanSchema } from '@/membership/db/definitions/membershipPlan';
import { IBaMembershipPlanDocument } from '@/membership/@types/membershipPlan';

export interface IBaMembershipPlanModel
  extends Model<IBaMembershipPlanDocument> {
  validateAndGet(
    planId: string,
    paidAmount: number,
    paidCurrency: string,
  ): Promise<IBaMembershipPlanDocument>;
  createPlan(doc: {
    name: string;
    description?: string;
    price: number;
    currency?: string;
    durationMonths?: number;
  }): Promise<IBaMembershipPlanDocument>;
  updatePlan(
    _id: string,
    doc: Partial<IBaMembershipPlanDocument>,
  ): Promise<IBaMembershipPlanDocument | null>;
  deactivatePlan(_id: string): Promise<IBaMembershipPlanDocument | null>;
}

export const loadBaMembershipPlanClass = (models: IModels) => {
  class BaMembershipPlan {
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
      return models.MembershipPlan.create({
        ...doc,
        isActive: true,
      });
    }

    public static async updatePlan(
      _id: string,
      doc: Partial<IBaMembershipPlanDocument>,
    ) {
      const prev = await models.MembershipPlan.findOne({ _id }).lean();
      if (!prev) throw new Error(`Plan ${_id} not found`);

      return models.MembershipPlan.findOneAndUpdate(
        { _id },
        { $set: doc },
        { new: true },
      );
    }

    public static async deactivatePlan(_id: string) {
      return models.MembershipPlan.findOneAndUpdate(
        { _id },
        { $set: { isActive: false } },
        { new: true },
      );
    }
  }

  baMembershipPlanSchema.loadClass(BaMembershipPlan);
  return baMembershipPlanSchema;
};
