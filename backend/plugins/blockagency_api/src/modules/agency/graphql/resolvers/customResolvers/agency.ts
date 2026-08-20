import { IBlockAgencyDocument } from '~/modules/agency/@types/agency';
import {
  normalizeAttachment,
  normalizeAttachments,
} from '~/modules/agency/utils';

export const BlockAgency = {
  logo: ({ logo }: IBlockAgencyDocument) => normalizeAttachment(logo),
  coverImage: ({ coverImage }: IBlockAgencyDocument) =>
    normalizeAttachment(coverImage),
  documents: ({ documents }: IBlockAgencyDocument) =>
    normalizeAttachments(documents),
};
