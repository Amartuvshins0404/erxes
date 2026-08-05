import { Resolver } from 'erxes-api-shared/core-types';
import { markResolvers, sendTRPCMessage } from 'erxes-api-shared/utils';
import { IContext } from '~/connectionResolvers';
import { EventStatus } from '@/event/constants';
import { refreshEventKnowledgeSource } from '@/event/meta/automations';
import { InvitationStatus } from '@/invitation/constants';
import { sendEventInvitations } from '@/invitation/sendInvitations';

export const invitationMutations: Record<string, Resolver> = {
  async eventInvitationsSend(
    _root: undefined,
    {
      _id,
      title,
      message,
    }: { _id: string; title?: string; message?: string },
    { models, subdomain, user }: IContext,
  ) {
    const event = await models.Events.getEvent(_id);

    if (event.status !== EventStatus.PUBLISHED) {
      throw new Error('Only published events can send invitations');
    }

    return sendEventInvitations(models, subdomain, event, {
      title,
      message,
      sentBy: user._id,
    });
  },
};

export const invitationClientPortalMutations: Record<string, Resolver> = {
  async cpEventRespond(
    _root: undefined,
    { eventId, status }: { eventId: string; status: InvitationStatus },
    { models, subdomain, cpUser }: IContext,
  ) {
    const customer = await sendTRPCMessage({
      subdomain,
      pluginName: 'core',
      method: 'query',
      module: 'customers',
      action: 'findOne',
      input: { query: { _id: cpUser.erxesCustomerId } },
      defaultValue: null,
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    const invitation = await models.Invitations.respond(
      eventId,
      customer._id,
      status,
    );

    await refreshEventKnowledgeSource({ subdomain, eventId });

    return invitation;
  },
};

markResolvers(invitationClientPortalMutations, {
  wrapperConfig: { forClientPortal: true, cpUserRequired: true },
});
