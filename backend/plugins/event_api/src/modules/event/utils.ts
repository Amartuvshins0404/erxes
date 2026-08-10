import { escapeRegExp } from 'erxes-api-shared/utils';
import { FilterQuery } from 'mongoose';
import { AGENDA_TIME_PATTERN, EventTab } from '@/event/constants';
import {
  EventQueryParams,
  IEventAgendaItem,
  IEventDocument,
} from '@/event/@types/event';

const toMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

export const validateEventDates = (startDate: Date, endDate: Date) => {
  if (new Date(endDate) < new Date(startDate)) {
    throw new Error('End date must be on or after start date');
  }
};

export const validateAgenda = (agenda?: IEventAgendaItem[]) => {
  if (!agenda?.length) {
    return;
  }

  for (const item of agenda) {
    if (
      !AGENDA_TIME_PATTERN.test(item.startTime) ||
      !AGENDA_TIME_PATTERN.test(item.endTime)
    ) {
      throw new Error(
        `Agenda times must be in HH:mm format, got "${item.startTime}" - "${item.endTime}"`,
      );
    }

    if (toMinutes(item.endTime) <= toMinutes(item.startTime)) {
      throw new Error(
        `Agenda item "${item.title}" must end after it starts`,
      );
    }
  }

  const ordered = [...agenda].sort(
    (a, b) => toMinutes(a.startTime) - toMinutes(b.startTime),
  );

  for (let i = 1; i < ordered.length; i++) {
    if (toMinutes(ordered[i].startTime) < toMinutes(ordered[i - 1].endTime)) {
      throw new Error(
        `Agenda items "${ordered[i - 1].title}" and "${ordered[i].title}" overlap`,
      );
    }
  }
};

export const generateFilter = (
  params: EventQueryParams,
): FilterQuery<IEventDocument> => {
  const { searchValue, status, tab, ownerId, startDateFrom, startDateTo, ids } =
    params;

  const filter: FilterQuery<IEventDocument> = {};

  if (ids?.length) {
    filter._id = { $in: ids };
  }

  if (status) {
    filter.status = status;
  }

  if (ownerId) {
    filter.ownerId = ownerId;
  }

  if (searchValue) {
    const regex = new RegExp(`.*${escapeRegExp(searchValue)}.*`, 'i');
    filter.$or = [
      { name: regex },
      { 'location.address': regex },
      { 'location.city': regex },
      { 'location.district': regex },
    ];
  }

  const startDate: Record<string, Date> = {};

  if (startDateFrom) {
    startDate.$gte = new Date(startDateFrom);
  }

  if (startDateTo) {
    startDate.$lte = new Date(startDateTo);
  }

  const now = new Date();

  if (tab === EventTab.UPCOMING) {
    startDate.$gte = startDate.$gte && startDate.$gte > now ? startDate.$gte : now;
  }

  if (tab === EventTab.PAST) {
    startDate.$lt = startDate.$lt && startDate.$lt < now ? startDate.$lt : now;
  }

  if (Object.keys(startDate).length) {
    filter.startDate = startDate;
  }

  return filter;
};
