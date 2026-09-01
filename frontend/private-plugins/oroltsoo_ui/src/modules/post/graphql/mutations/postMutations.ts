import { gql } from '@apollo/client';

import { OROLTSOO_POST_FIELDS } from '../queries/postQueries';

export const OROLTSOO_POST_ADD = gql`
  mutation OroltsooPostAdd($input: OroltsooPostInput!) {
    oroltsooPostAdd(input: $input) {
      ${OROLTSOO_POST_FIELDS}
    }
  }
`;

export const OROLTSOO_POST_EDIT = gql`
  mutation OroltsooPostEdit($id: String!, $input: OroltsooPostInput!) {
    oroltsooPostEdit(_id: $id, input: $input) {
      ${OROLTSOO_POST_FIELDS}
    }
  }
`;

export const OROLTSOO_POST_REMOVE = gql`
  mutation OroltsooPostRemove($ids: [String!]!) {
    oroltsooPostRemove(_ids: $ids)
  }
`;
