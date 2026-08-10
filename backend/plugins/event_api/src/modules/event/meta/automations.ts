import {
  buildKnowledgeSourceType,
  enqueueAiKnowledgeSourceRefreshJob,
  type TKnowledgeDocument,
} from 'erxes-api-shared/utils';
import type { TAutomationProducersInput } from 'erxes-api-shared/core-modules';
import type { IModels } from '~/connectionResolvers';
import { EventStatus } from '@/event/constants';
import { IEventAgendaDocument, IEventDocument } from '@/event/@types/event';
import { InvitationStatus } from '@/invitation/constants';

export const EVENT_KNOWLEDGE_SOURCE_KEY = 'event.event';

export const refreshEventKnowledgeSource = async ({
  subdomain,
  eventId,
}: {
  subdomain: string;
  eventId: string;
}) => {
  try {
    await enqueueAiKnowledgeSourceRefreshJob({
      subdomain,
      source: {
        pluginName: 'event',
        moduleName: 'event',
        key: EVENT_KNOWLEDGE_SOURCE_KEY,
        sourceId: eventId,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error(
      `Failed to queue event knowledge source refresh for ${eventId}:`,
      error,
    );
  }
};

const getEventUpdatedAt = (event: { updatedAt?: Date; createdAt?: Date }) =>
  (event.updatedAt || event.createdAt || new Date()).toISOString();

const formatDateRange = (startDate?: Date, endDate?: Date) => {
  if (!startDate) {
    return '';
  }

  const start = new Date(startDate).toISOString();

  if (!endDate) {
    return start;
  }

  return `${start} – ${new Date(endDate).toISOString()}`;
};

const formatLocation = (event: IEventDocument) => {
  if (event.isOnline) {
    return event.onlineUrl ? `Online: ${event.onlineUrl}` : 'Online event';
  }

  const location = event.location;

  if (!location) {
    return '';
  }

  return [location.address, location.district, location.city]
    .filter(Boolean)
    .join(', ');
};

const formatAgenda = (agenda: IEventAgendaDocument[]) =>
  agenda
    .map((item) => {
      const description = item.description ? `: ${item.description}` : '';

      return `- ${item.startTime}–${item.endTime} ${item.title}${description}`;
    })
    .join('\n');

const formatAttendance = (event: IEventDocument, goingCount: number) => {
  if (!event.capacity) {
    return (
      `**Attendance:** ${goingCount} going so far. This event has no capacity ` +
      `limit and no RSVP deadline — you can accept at any time and will always ` +
      `get in.`
    );
  }

  const remaining = Math.max(event.capacity - goingCount, 0);

  if (remaining > 0) {
    return (
      `**Attendance:** ${goingCount} of ${event.capacity} seats taken, ` +
      `${remaining} remaining. There is no RSVP deadline — responses are ` +
      `accepted on a first-come, first-served basis: whoever responds "going" ` +
      `while seats remain gets in, no matter how many days after being invited ` +
      `that is. It only becomes impossible to join as "going" once the event ` +
      `fills up before you respond.`
    );
  }

  return (
    `**Attendance:** ${event.capacity} of ${event.capacity} seats taken — ` +
    `this event is at capacity. New "going" responses are rejected until a ` +
    `seat opens up (e.g. someone already going changes their answer); ` +
    `"maybe" and "declined" responses are still accepted at any time.`
  );
};

const toKnowledgeDocument = (
  event: IEventDocument,
  agenda: IEventAgendaDocument[],
  goingCount: number,
): TKnowledgeDocument => {
  const location = formatLocation(event);
  const dateRange = formatDateRange(event.startDate, event.endDate);

  const sections = [
    event.description,
    dateRange && `**When:** ${dateRange}`,
    location && `**Where:** ${location}`,
    formatAttendance(event, goingCount),
    agenda.length ? `**Agenda:**\n${formatAgenda(agenda)}` : undefined,
  ].filter(Boolean);

  return {
    source: {
      type: buildKnowledgeSourceType({
        pluginName: 'event',
        moduleName: 'event',
        key: EVENT_KNOWLEDGE_SOURCE_KEY,
      }),
      id: event._id,
      version: getEventUpdatedAt(event),
      updatedAt: getEventUpdatedAt(event),
    },
    title: event.name || 'Untitled event',
    content: sections.join('\n\n'),
    contentFormat: 'markdown',
    metadata: {
      visibility: 'public',
    },
  };
};

export const eventAiKnowledgeProvider = {
  async loadAiKnowledgeDocumentBatch(
    {
      sourceKey,
      sourceIds = [],
      cursor,
      limit,
    }: TAutomationProducersInput['loadAiKnowledgeDocumentBatch'],
    { models }: { models: IModels },
  ) {
    if (sourceKey !== EVENT_KNOWLEDGE_SOURCE_KEY) {
      throw new Error(`Unsupported AI knowledge source: ${sourceKey}`);
    }

    if (!sourceIds.length) {
      return {
        documents: [],
        totalCount: 0,
        hasMore: false,
      };
    }

    const startIndex = Math.max(Number(cursor || 0) || 0, 0);
    const batchLimit = Math.min(
      Math.max(Math.floor(limit || sourceIds.length), 1),
      5000,
    );
    const batchSourceIds = sourceIds.slice(startIndex, startIndex + batchLimit);

    const events = await models.Events.find({
      _id: { $in: batchSourceIds },
      status: EventStatus.PUBLISHED,
    }).lean();

    const agendaByEventId = new Map<string, IEventAgendaDocument[]>();
    const goingCountByEventId = new Map<string, number>();

    if (events.length) {
      const eventIds = events.map((event) => event._id);

      const [agendaItems, goingGroups] = await Promise.all([
        models.EventAgendas.find({ eventId: { $in: eventIds } })
          .sort({ startTime: 1 })
          .lean(),
        models.Invitations.aggregate<{ _id: string; count: number }>([
          {
            $match: {
              eventId: { $in: eventIds },
              status: InvitationStatus.GOING,
            },
          },
          { $group: { _id: '$eventId', count: { $sum: 1 } } },
        ]),
      ]);

      for (const item of agendaItems) {
        const list = agendaByEventId.get(item.eventId) || [];
        list.push(item);
        agendaByEventId.set(item.eventId, list);
      }

      for (const group of goingGroups) {
        goingCountByEventId.set(group._id, group.count);
      }
    }

    const nextIndex = startIndex + batchLimit;
    const documents = events
      .map((event) =>
        toKnowledgeDocument(
          event,
          agendaByEventId.get(event._id) || [],
          goingCountByEventId.get(event._id) || 0,
        ),
      )
      .filter((document) => document.content.trim().length > 0);

    return {
      documents,
      totalCount: sourceIds.length,
      nextCursor: nextIndex < sourceIds.length ? String(nextIndex) : undefined,
      hasMore: nextIndex < sourceIds.length,
    };
  },
};
