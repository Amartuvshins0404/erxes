import { Model } from 'mongoose';
import {
  IContractPaymentSettings,
  IContractPaymentSettingsDocument,
  IContractPaymentSettingsInput,
} from '@/contract/@types/paymentSettings';
import { contractPaymentSettingsSchema } from '@/contract/db/definitions/paymentSettings';
import { IModels } from '~/connectionResolvers';

export interface IContractPaymentSettingsModel
  extends Model<IContractPaymentSettingsDocument> {
  getSettings(projectId?: string): Promise<IContractPaymentSettings | null>;
  updateSettings(
    input: IContractPaymentSettingsInput,
    projectId?: string,
  ): Promise<IContractPaymentSettingsDocument>;
}

export const loadContractPaymentSettingsClass = (models: IModels) => {
  // Two levels: one org-wide default document (`projectId: null`) and an
  // optional per-project override. A project document, once saved, replaces the
  // default outright for that project rather than merging field by field.
  class ContractPaymentSettings {
    public static async getSettings(projectId?: string) {
      if (projectId) {
        const projectSettings = await models.ContractPaymentSettings.findOne({
          projectId,
        }).lean();

        if (projectSettings) {
          return projectSettings;
        }
      }

      // Matches both an explicit `null` and documents written before
      // `projectId` existed on this schema.
      return models.ContractPaymentSettings.findOne({ projectId: null }).lean();
    }

    public static async updateSettings(
      input: IContractPaymentSettingsInput,
      projectId?: string,
    ) {
      const scope = projectId || null;

      const existing = await models.ContractPaymentSettings.findOne({
        projectId: scope,
      });

      if (!existing) {
        return models.ContractPaymentSettings.create({
          projectId: scope,
          paymentIds: (input.paymentIds || []).filter(Boolean),
          allowPartial: input.allowPartial || false,
        });
      }

      if (input.paymentIds) {
        existing.paymentIds = input.paymentIds.filter(Boolean);
      }

      if (input.allowPartial !== undefined) {
        existing.allowPartial = input.allowPartial;
      }

      await existing.save();

      return existing;
    }
  }

  contractPaymentSettingsSchema.loadClass(ContractPaymentSettings);

  return contractPaymentSettingsSchema;
};
