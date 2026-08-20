import { gql } from '@apollo/client';

export const MTO_TRAVEL_ASSOCIATIONS = gql`
  query MtoTravelAssociations(
    $searchValue: String
    $foundDateFrom: Date
    $foundDateTo: Date
  ) {
    mtoTravelAssociations(
      searchValue: $searchValue
      foundDateFrom: $foundDateFrom
      foundDateTo: $foundDateTo
    ) {
      _id
      title {
        en
        mn
      }
      description {
        en
        mn
      }
      logo
      cover
      foundDate
      createdAt
      modifiedAt
    }
  }
`;

export const MTO_TRAVEL_ASSOCIATION = gql`
  query MtoTravelAssociation($_id: String!) {
    mtoTravelAssociation(_id: $_id) {
      _id
      title {
        en
        mn
      }
      description {
        en
        mn
      }
      logo
      cover
      foundDate
      createdAt
      modifiedAt
    }
  }
`;
