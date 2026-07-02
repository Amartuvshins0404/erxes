import { gql } from '@apollo/client';

export const GET_POS_CONFIGS = gql`
  query PosclientConfigs {
    posclientConfigs {
      _id
      name
      token
    }
  }
`;
