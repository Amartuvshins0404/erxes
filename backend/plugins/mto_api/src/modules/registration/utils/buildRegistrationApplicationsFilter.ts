import { ICursorPaginateParams } from 'erxes-api-shared/core-types';
import { escapeRegExp } from 'erxes-api-shared/utils';

export interface IRegistrationApplicationsFilterParams
  extends ICursorPaginateParams {
  membershipTypeId?: string;
  status?: string;
  cpUserId?: string;
  name?: string;
  registrationNumber?: string;
  email?: string;
  createdAtFrom?: Date | string;
  createdAtTo?: Date | string;
  activityCategory?: string;
  archived?: boolean;
}

const NAME_ANSWER_KEYS = [
  'legal_entity_name',
  'business_name_en',
  'org_name',
  'ngo_name',
  'first_name',
  'last_name',
] as const;

function toDate(value: Date | string | undefined): Date | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function buildRegistrationApplicationsFilter(
  params: IRegistrationApplicationsFilterParams,
  subdomain: string,
  instanceId?: string,
  cpUser?: { _id: string },
): Record<string, unknown> {
  const filter: Record<string, unknown> = { subdomain };
  const andConditions: Record<string, unknown>[] = [];

  if (instanceId) {
    filter.instanceId = instanceId;
  }

  if (cpUser?._id) {
    filter.cpUserId = String(cpUser._id);
  } else if (params.cpUserId) {
    filter.cpUserId = String(params.cpUserId);
  }

  if (params.membershipTypeId) {
    filter.membershipTypeId = params.membershipTypeId;
  }

  if (params.status) {
    filter.status = params.status;
  }

  if (params.archived === true) {
    filter.archivedAt = { $exists: true, $ne: null };
  } else {
    andConditions.push({
      $or: [{ archivedAt: { $exists: false } }, { archivedAt: null }],
    });
  }

  const name = params.name?.trim();
  if (name) {
    const escaped = escapeRegExp(name);
    andConditions.push({
      $or: NAME_ANSWER_KEYS.map((key) => ({
        [`answers.${key}`]: {
          $regex: `.*${escaped}.*`,
          $options: 'i',
        },
      })),
    });
  }

  const registrationNumber = params.registrationNumber?.trim();
  if (registrationNumber) {
    filter['answers.registration_number'] = {
      $regex: `.*${escapeRegExp(registrationNumber)}.*`,
      $options: 'i',
    };
  }

  const email = params.email?.trim();
  if (email) {
    filter['answers.contact_email'] = {
      $regex: `.*${escapeRegExp(email)}.*`,
      $options: 'i',
    };
  }

  const createdAtFrom = toDate(params.createdAtFrom);
  const createdAtTo = toDate(params.createdAtTo);
  if (createdAtFrom || createdAtTo) {
    const createdAt: Record<string, Date> = {};
    if (createdAtFrom) {
      createdAt.$gte = createdAtFrom;
    }
    if (createdAtTo) {
      const end = new Date(createdAtTo);
      if (
        end.getHours() === 0 &&
        end.getMinutes() === 0 &&
        end.getSeconds() === 0 &&
        end.getMilliseconds() === 0
      ) {
        end.setHours(23, 59, 59, 999);
      }
      createdAt.$lte = end;
    }
    filter.createdAt = createdAt;
  }

  const activityCategory = params.activityCategory?.trim();
  if (activityCategory) {
    andConditions.push({
      $or: [
        { 'answers.activity_directions': activityCategory },
        { 'answers.org_categories': activityCategory },
        { 'answers.product_types': activityCategory },
      ],
    });
  }

  if (andConditions.length > 0) {
    filter.$and = andConditions;
  }

  return filter;
}
