import { IAttachment } from 'erxes-api-shared/core-types';
import { FilterQuery } from 'mongoose';
import { AgencyQueryParams, IBlockAgencyDocument } from './@types/agency';

/**
 * `logo`, `coverImage` and `documents` used to be stored as plain url strings.
 * Agencies synced before the attachment migration still hold that shape, so
 * every read normalizes them into the `Attachment` graphql type. Only `url` is
 * required by that type, the remaining file info is unknown for legacy values.
 */
export type IAttachmentValue = Partial<IAttachment> & { url: string };

type ILegacyAttachment = string | Partial<IAttachment> | null | undefined;

const getFileName = (url: string) => url.split('/').pop() || url;

export const normalizeAttachment = (
  value: ILegacyAttachment,
): IAttachmentValue | null => {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    return { url: value, name: getFileName(value) };
  }

  const { url, name, type, size } = value;

  if (!url) {
    return null;
  }

  return { url, name: name || getFileName(url), type, size };
};

export const normalizeAttachments = (
  values: ILegacyAttachment[] | undefined,
): IAttachmentValue[] =>
  (values || [])
    .map(normalizeAttachment)
    .filter((attachment): attachment is IAttachmentValue => !!attachment);

export const generateFilter = async (params: AgencyQueryParams) => {
  const { searchValue, city, district, verificationStatus } = params;

  const filter: FilterQuery<IBlockAgencyDocument> = {};

  if (searchValue) {
    filter.name = { $regex: searchValue, $options: 'i' };
  }

  if (city) {
    filter['operationArea.city'] = city;
  }

  if (district) {
    filter['operationArea.district'] = district;
  }

  if (verificationStatus) {
    filter.verificationStatus = verificationStatus;
  }

  return filter;
};
