import mongoose from 'mongoose';
import { IModels } from '~/connectionResolvers';
import { IBaMembershipDocument } from '@/membership/@types/membership';
import {
  IBaMembershipModel,
  loadBaMembershipClass,
} from '@/membership/db/models/Membership';
import { IBaMembershipPlanDocument } from '@/membership/@types/membershipPlan';
import {
  IBaMembershipPlanModel,
  loadBaMembershipPlanClass,
} from '@/membership/db/models/MembershipPlan';

export interface IMembershipModels {
  Membership: IBaMembershipModel;
  MembershipPlan: IBaMembershipPlanModel;
}

export const loadMembershipModels = (
  models: IModels,
  db: mongoose.Connection,
) => {
  models.Membership = db.model<IBaMembershipDocument, IBaMembershipModel>(
    'block_admin_memberships',
    loadBaMembershipClass(models),
  );

  models.MembershipPlan = db.model<
    IBaMembershipPlanDocument,
    IBaMembershipPlanModel
  >('block_admin_membership_plans', loadBaMembershipPlanClass(models));
};
