import { IAttachment } from 'erxes-api-shared/core-types';
import { IModels } from '~/connectionResolvers';
import { seedAgencyOwnerMembers } from '~/modules/member/utils';

/**
 * `logo`, `coverImage` and `documents` used to be stored as plain url strings.
 * Documents saved before the attachment migration still hold that shape, so
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

/**
 * A tenant owns exactly one agency document, so "this tenant's agency" is
 * resolved here rather than taken from the client. The document is created on
 * first use — the profile page has always relied on that — and its creation is
 * also when the tenant's owners are seeded as its `admin` members.
 */
export const ensureTenantAgency = async (
  models: IModels,
  subdomain: string,
) => {
  const agency = await models.BlockAgency.findOne({}).lean();

  if (agency) {
    return agency;
  }

  const created = await models.BlockAgency.create({});

  await seedAgencyOwnerMembers(models, subdomain, String(created._id));

  return created.toObject();
};
