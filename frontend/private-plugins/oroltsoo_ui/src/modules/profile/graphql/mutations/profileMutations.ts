import { gql } from '@apollo/client';

import { OROLTSOO_PROFILE_FIELDS } from '../queries/profileQueries';

export const OROLTSOO_PROFILE_UPDATE = gql`
  mutation OroltsooProfileUpdate($input: OroltsooProfileInput!) {
    oroltsooProfileUpdate(input: $input) {
      ${OROLTSOO_PROFILE_FIELDS}
    }
  }
`;
