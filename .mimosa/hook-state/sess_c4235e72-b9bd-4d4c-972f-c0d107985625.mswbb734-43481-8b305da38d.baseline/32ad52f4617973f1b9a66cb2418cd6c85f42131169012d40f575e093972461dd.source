import { gql } from '@apollo/client';

export const FIX_AND_RESTART_OPENCODE = gql`
  mutation FixAndRestartOpencode($identifierId: String!) {
    fixAndRestartOpencode(identifierId: $identifierId)
  }
`;

export const SET_OPENCODE_API_KEY = gql`
  mutation SetOpencodeApiKey($identifierId: String!, $input: SetOpencodeApiKeyInput!) {
    setOpencodeApiKey(identifierId: $identifierId, input: $input)
  }
`;
