import { IRegistrationApplicationDocument } from '@/registration/@types/registrationApplicationDocument';
import { sendTRPCMessage } from 'erxes-api-shared/utils';
import { IContext } from '~/connectionResolvers';

const resolvers = {
  MtoRegistrationApplication: {
    invoice: async (
      application: IRegistrationApplicationDocument,
      _params: undefined,
      context: IContext,
    ) => {
      if (!application.invoiceId) {
        return null;
      }

      const { subdomain } = context;

      try {
        const invoice = await sendTRPCMessage({
          subdomain,
          pluginName: 'payment',
          method: 'query',
          module: 'payment',
          action: 'getInvoiceWithTransactions',
          input: {
            _id: application.invoiceId,
          },
          defaultValue: null,
        });

        if (!invoice) {
          return null;
        }

        return invoice;
      } catch {
        return null;
      }
    },
  },
};

export default resolvers;
