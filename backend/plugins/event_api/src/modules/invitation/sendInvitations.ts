import { sendTRPCMessage } from 'erxes-api-shared/utils';
import { IEventDocument } from '@/event/@types/event';
import { IModels } from '~/connectionResolvers';

const CP_USERS_PAGE_SIZE = 1000;

type CpUser = {
  _id: string;
  clientPortalId?: string;
  erxesCustomerId?: string;
};

type CpUserListResult = {
  list: CpUser[];
  totalCount: number;
};

export type SendInvitationsResult = {
  recipientCount: number;
  invitedCount: number;
};

const fetchAllCpUsers = async (subdomain: string): Promise<CpUser[]> => {
  const cpUsers: CpUser[] = [];
  let skip = 0;

  while (true) {
    const result: CpUserListResult = await sendTRPCMessage({
      subdomain,
      pluginName: 'core',
      method: 'query',
      module: 'cpUsers',
      action: 'list',
      input: { limit: CP_USERS_PAGE_SIZE, skip },
      defaultValue: { list: [], totalCount: 0 },
    });

    cpUsers.push(...result.list);

    if (skip + CP_USERS_PAGE_SIZE >= result.totalCount) {
      break;
    }

    skip += CP_USERS_PAGE_SIZE;
  }

  return cpUsers;
};

/** Falls back to the event itself when the sender leaves a field blank. */
const buildNotificationData = (
  event: IEventDocument,
  title?: string,
  message?: string,
) => {
  const startsAt = event.startDate
    ? new Date(event.startDate).toLocaleString()
    : '';

  return {
    title: title?.trim() || event.name?.trim() || 'You are invited to an event',
    message:
      message?.trim() ||
      (startsAt ? `Starts ${startsAt}` : 'You have a new invitation'),
    type: 'info' as const,
    contentType: 'event:event',
    contentTypeId: event._id,
    priority: 'medium' as const,
    action: 'openEvent',
    kind: 'user' as const,
    metadata: { eventId: event._id },
  };
};

/**
 * Invites every client-portal user to an event: one pending invitation row per
 * customer, then a client-portal notification per user.
 *
 * Recipients are grouped by their own `clientPortalId` rather than one taken
 * from the event, because events are not portal-scoped and core's
 * `cpNotifications.create` requires a portal it can resolve.
 */
export const sendEventInvitations = async (
  models: IModels,
  subdomain: string,
  event: IEventDocument,
  {
    title,
    message,
    sentBy,
  }: { title?: string; message?: string; sentBy?: string },
): Promise<SendInvitationsResult> => {
  const cpUsers = await fetchAllCpUsers(subdomain);

  if (cpUsers.length === 0) {
    return { recipientCount: 0, invitedCount: 0 };
  }

  // Invitations key on the core customer, so a portal user without a linked
  // customer can still be notified but cannot be counted in attendance.
  const customerIds = [
    ...new Set(
      cpUsers
        .map((cpUser) => cpUser.erxesCustomerId)
        .filter((customerId): customerId is string => !!customerId),
    ),
  ];

  const invitedCount = await models.Invitations.inviteMany(event._id, customerIds, {
    message,
    sentBy,
  });

  const usersByPortal = new Map<string, string[]>();

  for (const cpUser of cpUsers) {
    if (!cpUser.clientPortalId) {
      continue;
    }

    const existing = usersByPortal.get(cpUser.clientPortalId) ?? [];
    existing.push(cpUser._id);
    usersByPortal.set(cpUser.clientPortalId, existing);
  }

  const data = buildNotificationData(event, title, message);

  for (const [clientPortalId, cpUserIds] of usersByPortal) {
    await sendTRPCMessage({
      subdomain,
      pluginName: 'core',
      method: 'mutation',
      module: 'cpNotifications',
      action: 'create',
      input: {
        cpUserIds,
        clientPortalId,
        eventType: 'eventInvited',
        data,
      },
    });
  }

  return { recipientCount: cpUsers.length, invitedCount };
};
