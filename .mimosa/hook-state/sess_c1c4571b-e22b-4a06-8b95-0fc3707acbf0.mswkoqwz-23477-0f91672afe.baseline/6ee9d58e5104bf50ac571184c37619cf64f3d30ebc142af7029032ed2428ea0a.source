import { gql } from '@apollo/client';

export const CREATE_CV_RISK_GROUP = gql`
  mutation CreateCVRiskGroup($input: CVRiskGroupInput!) {
    cvCreateRiskGroup(input: $input) {
      _id
    }
  }
`;

export const UPDATE_CV_RISK_GROUP = gql`
  mutation UpdateCVRiskGroup($id: String!, $input: CVRiskGroupInput!) {
    cvUpdateRiskGroup(_id: $id, input: $input) {
      _id
    }
  }
`;

export const DELETE_CV_RISK_GROUP = gql`
  mutation CvDeleteRiskGroup($id: String!) {
    cvDeleteRiskGroup(_id: $id) {
      _id
    }
  }
`;

