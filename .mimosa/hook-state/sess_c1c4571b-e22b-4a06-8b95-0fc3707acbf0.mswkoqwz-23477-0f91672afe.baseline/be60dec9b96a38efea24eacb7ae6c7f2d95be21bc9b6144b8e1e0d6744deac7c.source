import { gql } from '@apollo/client';

export const CREATE_CV_MARKET = gql`
  mutation CreateCVMarket($input: CVMarketInput!) {
    cvCreateMarket(input: $input) {
      _id
    }
  }
`;

export const UPDATE_CV_MARKET = gql`
  mutation UpdateCVMarket($id: String!, $input: CVMarketInput!) {
    cvUpdateMarket(_id: $id, input: $input) {
      _id
    }
  }
`;

export const DELETE_CV_MARKET = gql`
  mutation CvRemoveMarket($id: String!) {
    cvRemoveMarket(_id: $id)
  }
`;

