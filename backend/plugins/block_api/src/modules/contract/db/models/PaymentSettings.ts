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
  getSettings(): Promise<IContractPaymentSettings | null>;
  updateSettings(
    input: IContractPaymentSettingsInput,
  ): Promise<IContractPaymentSettingsDocument>;
}

export const loadContractPaymentSettingsClass = (models: IModels) => {
  // Org-wide singleton: there is one online-payment configuration per org
  // deployment, so every read/write targets the first (and only) document.
  class ContractPaymentSettings {
    public static async getSettings() {
      return models.ContractPaymentSettings.findOne().lean();
    }

    public static async updateSettings(input: IContractPaymentSettingsInput) {
      const existing = await models.ContractPaymentSettings.findOne();

      if (!existing) {
        return models.ContractPaymentSettings.create({
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
