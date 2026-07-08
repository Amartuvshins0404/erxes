import {
  handleMembershipPayment,
  IMembershipPaymentData,
} from '@/membership/payments';

type IPaymentCallbackData = IMembershipPaymentData;

export const payments = {
  transactionCallback: async () => {
    // no-op: membership state is settled in `callback` once the invoice is paid
  },
  callback: async (
    { subdomain }: { subdomain: string },
    data: IPaymentCallbackData,
  ) => {
    if (data.status !== 'paid') {
      return;
    }

    try {
      switch (data.contentType) {
        case 'blockadmin:membership':
          await handleMembershipPayment(subdomain, data);
          break;
        default:
          return;
      }
    } catch (e: any) {
      console.error(
        `[blockadmin:payments] callback failed for invoice ${data._id}: ${e.message}`,
      );
      throw e;
    }
  },
};
