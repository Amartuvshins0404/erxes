import { IBlockAgencyDocument } from '@/agency/@types/agency';
import { normalizeAttachment, normalizeAttachments } from '@/agency/utils';

export const BlockAdminAgency = {
  logo: ({ logo }: IBlockAgencyDocument) => normalizeAttachment(logo),
  coverImage: ({ coverImage }: IBlockAgencyDocument) =>
    normalizeAttachment(coverImage),
  documents: ({ documents }: IBlockAgencyDocument) =>
    normalizeAttachments(documents),
};
