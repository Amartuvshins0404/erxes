import { gql } from '@apollo/client';

export const MTO_TRAVEL_ASSOCIATION_CREATE = gql`
  mutation MtoTravelAssociationCreate(
    $title: MtoMultilingualStringInput!
    $description: MtoMultilingualStringOptionalInput
    $logo: String
    $cover: String
    $foundDate: Date!
  ) {
    mtoTravelAssociationCreate(
      title: $title
      description: $description
      logo: $logo
      cover: $cover
      foundDate: $foundDate
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
    }
  }
`;

export const MTO_TRAVEL_ASSOCIATION_UPDATE = gql`
  mutation MtoTravelAssociationUpdate(
    $_id: String!
    $title: MtoMultilingualStringInput
    $description: MtoMultilingualStringOptionalInput
    $logo: String
    $cover: String
    $foundDate: Date
  ) {
    mtoTravelAssociationUpdate(
      _id: $_id
      title: $title
      description: $description
      logo: $logo
      cover: $cover
      foundDate: $foundDate
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
      modifiedAt
    }
  }
`;

export const MTO_TRAVEL_ASSOCIATIONS_REMOVE = gql`
  mutation MtoTravelAssociationsRemove($ids: [String]!) {
    mtoTravelAssociationsRemove(ids: $ids)
  }
`;
