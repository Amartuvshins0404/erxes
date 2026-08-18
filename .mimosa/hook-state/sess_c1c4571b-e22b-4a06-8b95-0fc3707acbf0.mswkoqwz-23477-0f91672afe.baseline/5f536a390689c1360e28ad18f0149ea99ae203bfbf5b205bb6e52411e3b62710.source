import { gql } from '@apollo/client';

export const GET_OPENCODE_CREDENTIALS = gql`
  query GetOpencodeCredentials($identifierId: String!) {
    getOpencodeCredentials(identifierId: $identifierId) {
      username
      password
    }
  }
`;
