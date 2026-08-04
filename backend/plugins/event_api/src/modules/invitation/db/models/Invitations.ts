import {
  ICursorPaginateParams,
  ICursorPaginateResult,
} from 'erxes-api-shared/core-types';
import { cursorPaginate } from 'erxes-api-shared/utils';
import { Model } from 'mongoose';
import { IModels } from '~/connectionResolvers';
import { InvitationSource, InvitationStatus } from '@/invitation/constants';
import { invitationSchema } from '@/invitation/db/definitions/invitation';
import {
  IAttendanceSummary,
  IEventInvitationDocument,
  InvitationQueryParams,
} from '@/invitation/@types/invitation';
import { buildAttendanceSummary, generateFilter } from '@/invitation/utils';

export interface IInvitationModel extends Model<IEventInvitationDocument> {
  listInvitations(
    params: InvitationQueryParams & ICursorPaginateParams,
  ): Promise<ICursorPaginateResult<IEventInvitationDocument>>;
  listForCpUser(customerId: string): Promise<IEventInvitationDocument[]>;
  respond(
    eventId: string,
    customerId: string,
    status: InvitationStatus,
  ): Promise<IEventInvitationDocument>;
  inviteMany(
    eventId: string,
    customerIds: string[],
    options: { message?: string; sentBy?: string },
  ): Promise<number>;
  getAttendanceSummary(eventId: string): Promise<IAttendanceSummary>;
  countGoing(eventId: string): Promise<number>;
}

export const loadInvitationClass = (models: IModels) => {
  class Invitation {
    public static async listInvitations(
      params: InvitationQueryParams & ICursorPaginateParams,
    ) {
      return cursorPaginate<IEventInvitationDocument>({
        model: models.Invitations,
        params,
        query: generateFilter(params),
      });
    }

    public static async listForCpUser(customerId: string) {
      return models.Invitations.find({ customerId }).sort({ createdAt: -1 });
    }

    public static async respond(
      eventId: string,
      customerId: string,
      status: InvitationStatus,
    ) {
      const event = await models.Events.getEvent(eventId);

      const existing = await models.Invitations.findOne({
        eventId,
        customerId,
      });

      if (
        status === InvitationStatus.GOING &&
        existing?.status !== InvitationStatus.GOING &&
        event.capacity
      ) {
        const going = await models.Invitations.countDocuments({
          eventId,
          status: InvitationStatus.GOING,
        });

        if (going >= event.capacity) {
          throw new Error('This event has reached its capacity');
        }
      }

      const invitation = await models.Invitations.findOneAndUpdate(
        { eventId, customerId },
        {
          $set: {
            status,
            respondedAt: new Date(),
          },
          $setOnInsert: { source: InvitationSource.SELF },
        },
        { new: true, upsert: true },
      );

      if (!invitation) {
        throw new Error('Could not record the response');
      }

      return invitation;
    }

    /**
     * Bulk-invites customers to an event. Re-sending is safe: an existing row
     * only has its send metadata refreshed, so a reply already given is never
     * reset to pending. Returns how many rows the event now has.
     */
    public static async inviteMany(
      eventId: string,
      customerIds: string[],
      { message, sentBy }: { message?: string; sentBy?: string },
    ) {
      if (!customerIds.length) {
        return 0;
      }

      const sentAt = new Date();

      await models.Invitations.bulkWrite(
        customerIds.map((customerId) => ({
          updateOne: {
            filter: { eventId, customerId },
            update: {
              $set: { message, sentAt, sentBy },
              $setOnInsert: {
                status: InvitationStatus.PENDING,
                source: InvitationSource.INVITED,
              },
            },
            upsert: true,
          },
        })),
      );

      return models.Invitations.countDocuments({ eventId });
    }

    public static async getAttendanceSummary(eventId: string) {
      const grouped = await models.Invitations.aggregate<{
        _id: string;
        count: number;
      }>([
        { $match: { eventId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]);

      return buildAttendanceSummary(eventId, grouped);
    }

    public static async countGoing(eventId: string) {
      return models.Invitations.countDocuments({
        eventId,
        status: InvitationStatus.GOING,
      });
    }
  }

  invitationSchema.loadClass(Invitation);

  return invitationSchema;
};
