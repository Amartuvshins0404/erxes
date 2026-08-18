import { gql } from '@apollo/client';

export const CREATE_CV_CLIENT = gql`
  mutation CreateCVClient($input: CVClientInput!) {
    cvCreateClient(input: $input) {
      _id
    }
  }
`;

export const UPDATE_CV_CLIENT = gql`
  mutation UpdateCVClient($id: String!, $input: CVClientInput!) {
    updateCVClient(_id: $id, input: $input) {
      _id
    }
  }
`;

export const DELETE_CV_CLIENT = gql`
  mutation CvRemoveClient($id: String!) {
    cvRemoveClient(_id: $id)
  }
`;
