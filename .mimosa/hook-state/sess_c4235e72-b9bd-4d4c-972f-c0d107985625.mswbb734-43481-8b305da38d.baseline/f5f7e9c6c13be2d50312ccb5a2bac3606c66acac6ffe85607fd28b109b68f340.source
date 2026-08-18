import { gql } from '@apollo/client';
import { COLLECTIVE_FRAGMENT } from './queries';

export const UPDATE_GET_COLLECTIVE = gql`
  mutation CollectiveUpdateProfile($input: CollectiveInput!) {
    collectiveUpdateProfile(input: $input) {
      ...CollectiveFields
    }
  }
  ${COLLECTIVE_FRAGMENT}
`;
