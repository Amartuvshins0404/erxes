import {
  IRegistrationApplication,
  RegistrationApplicationStatus,
  RegistrationPaymentStatus,
} from '@/registration/@types/registrationApplication';
import { IRegistrationApplicationDocument } from '@/registration/@types/registrationApplicationDocument';
import { Model } from 'mongoose';
import { IModels } from '~/connectionResolvers';
import { registrationApplicationSchema } from '../definitions/registrationApplication';

export interface IRegistrationApplicationModel extends Model<IRegistrationApplicationDocument> {
  createApplication(
    doc: IRegistrationApplication,
  ): Promise<IRegistrationApplicationDocument>;
  updateApplicationById(
    _id: string,
    subdomain: string,
    patch: {
      answers?: Record<string, unknown>;
      status?: RegistrationApplicationStatus;
      cpUserId?: string | null;
      invoiceId?: string;
      paymentStatus?: RegistrationPaymentStatus;
      membershipFeeAmount?: number;
    },
  ): Promise<IRegistrationApplicationDocument | null>;
  markAsRead(
    _id: string,
    subdomain: string,
    isRead: boolean,
  ): Promise<IRegistrationApplicationDocument | null>;
}

export const loadRegistrationApplicationClass = (models: IModels) => {
  class RegistrationApplication {
    public static async createApplication(doc: IRegistrationApplication) {
      return models.RegistrationApplication.create({
        ...doc,
        createdAt: new Date(),
      });
    }

    public static async updateApplicationById(
      _id: string,
      subdomain: string,
      patch: {
        answers?: Record<string, unknown>;
        status?: RegistrationApplicationStatus;
        cpUserId?: string | null;
        invoiceId?: string;
        paymentStatus?: RegistrationPaymentStatus;
        membershipFeeAmount?: number;
      },
    ) {
      const hasAnswers = patch.answers !== undefined;
      const hasStatus = patch.status !== undefined;
      const hasCpUserId = patch.cpUserId !== undefined;
      const hasInvoiceId = patch.invoiceId !== undefined;
      const hasPaymentStatus = patch.paymentStatus !== undefined;
      const hasMembershipFeeAmount = patch.membershipFeeAmount !== undefined;
      if (
        !hasAnswers &&
        !hasStatus &&
        !hasCpUserId &&
        !hasInvoiceId &&
        !hasPaymentStatus &&
        !hasMembershipFeeAmount
      ) {
        throw new Error('Nothing to update');
      }

      const $set: Record<string, unknown> = { modifiedAt: new Date() };
      const $unset: Record<string, 1> = {};
      if (hasAnswers) {
        $set.answers = patch.answers;
      }
      if (hasStatus) {
        $set.status = patch.status;
      }
      if (hasCpUserId) {
        if (patch.cpUserId === null) {
          $unset.cpUserId = 1;
        } else {
          $set.cpUserId = patch.cpUserId;
        }
      }
      if (hasInvoiceId) {
        $set.invoiceId = patch.invoiceId;
      }
      if (hasPaymentStatus) {
        $set.paymentStatus = patch.paymentStatus;
      }
      if (hasMembershipFeeAmount) {
        $set.membershipFeeAmount = patch.membershipFeeAmount;
      }

      const update: Record<string, unknown> = { $set };
      if (Object.keys($unset).length > 0) {
        update.$unset = $unset;
      }

      return models.RegistrationApplication.findOneAndUpdate(
        { _id, subdomain },
        update,
        { new: true },
      );
    }

    public static async markAsRead(
      _id: string,
      subdomain: string,
      isRead: boolean,
    ) {
      return models.RegistrationApplication.findOneAndUpdate(
        { _id, subdomain },
        { $set: { isRead, modifiedAt: new Date() } },
        { new: true },
      );
    }
  }

  registrationApplicationSchema.loadClass(RegistrationApplication);

  return registrationApplicationSchema;
};
