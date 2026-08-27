import { gql } from '@apollo/client';

import { OROLTSOO_ADMIN_PROFILE_REVIEW_FIELDS } from '../queries/profileQueries';

export const OROLTSOO_ADMIN_PROFILE_VERIFY = gql`
  mutation OroltsooAdminProfileVerify($id: String!, $note: String) {
    oroltsooAdminProfileVerify(_id: $id, note: $note) {
      ${OROLTSOO_ADMIN_PROFILE_REVIEW_FIELDS}
    }
  }
`;

export const OROLTSOO_ADMIN_PROFILE_REJECT = gql`
  mutation OroltsooAdminProfileReject($id: String!, $note: String) {
    oroltsooAdminProfileReject(_id: $id, note: $note) {
      ${OROLTSOO_ADMIN_PROFILE_REVIEW_FIELDS}
    }
  }
`;
