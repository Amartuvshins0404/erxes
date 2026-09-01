import { IBlockAgencyDocument } from '@/agency/@types/agency';
import { normalizeAttachment } from '@/agency/utils';

export default {
  logo: ({ logo }: IBlockAgencyDocument) => normalizeAttachment(logo),
  coverImage: ({ coverImage }: IBlockAgencyDocument) =>
    normalizeAttachment(coverImage),
};
