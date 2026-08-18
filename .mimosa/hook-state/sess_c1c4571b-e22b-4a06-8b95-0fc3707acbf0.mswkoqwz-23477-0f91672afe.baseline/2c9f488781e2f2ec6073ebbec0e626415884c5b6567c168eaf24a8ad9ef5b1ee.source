import { gql } from '@apollo/client';

export const MUSHOP_CONFIG = gql`
  query MushopConfig($code: String!) {
    mushopConfig(code: $code) {
      _id
      code
      value
    }
  }
`;

export const MUSHOP_CONFIGS = gql`
  query MushopConfigs($codes: [String!]!) {
    mushopConfigs(codes: $codes) {
      _id
      code
      value
    }
  }
`;

export const MUSHOP_CONFIG_SAVE = gql`
  mutation MushopConfigSave($code: String!, $value: Float) {
    mushopConfigSave(code: $code, value: $value) {
      _id
      code
      value
    }
  }
`;
