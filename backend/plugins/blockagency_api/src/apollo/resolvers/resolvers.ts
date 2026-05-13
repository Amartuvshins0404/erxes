import { BlockAgency } from '~/modules/agency/graphql/resolvers/customResolvers/agency';
import { BlockListing } from '~/modules/listing/graphql/resolvers/customResolvers/listing';
import { BlockAgencyUnit } from '~/modules/unit/graphql/resolvers/customResolvers/unit';

export const customResolvers = {
  BlockAgency,
  BlockListing,
  BlockAgencyUnit,
  BlockMember: {
    member: async ({memberId}) => {
      return {
        __typename: "User",
        _id: memberId
      }
    }
  }
};
