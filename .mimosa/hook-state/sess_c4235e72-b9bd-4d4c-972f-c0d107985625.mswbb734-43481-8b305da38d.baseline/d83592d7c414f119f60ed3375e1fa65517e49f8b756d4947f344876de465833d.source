import { gql } from '@apollo/client';

export const MTO_EVENT_CREATE = gql`
  mutation MtoEventCreate(
    $title: MtoMultilingualStringInput!
    $description: MtoMultilingualStringOptionalInput
    $image: String
    $startDate: Date!
    $endDate: Date!
    $location: String
    $categoryIds: [String]
    $status: String
    $isActive: Boolean
  ) {
    mtoEventCreate(
      title: $title
      description: $description
      image: $image
      startDate: $startDate
      endDate: $endDate
      location: $location
      categoryIds: $categoryIds
      status: $status
      isActive: $isActive
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
      image
      startDate
      endDate
      location
      categoryIds
      status
      isActive
      createdAt
    }
  }
`;

export const MTO_EVENT_UPDATE = gql`
  mutation MtoEventUpdate(
    $_id: String!
    $title: MtoMultilingualStringInput
    $description: MtoMultilingualStringOptionalInput
    $image: String
    $startDate: Date
    $endDate: Date
    $location: String
    $categoryIds: [String]
    $status: String
    $isActive: Boolean
  ) {
    mtoEventUpdate(
      _id: $_id
      title: $title
      description: $description
      image: $image
      startDate: $startDate
      endDate: $endDate
      location: $location
      categoryIds: $categoryIds
      status: $status
      isActive: $isActive
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
      image
      startDate
      endDate
      location
      categoryIds
      status
      isActive
      modifiedAt
    }
  }
`;

export const MTO_EVENTS_REMOVE = gql`
  mutation MtoEventsRemove($ids: [String]!) {
    mtoEventsRemove(ids: $ids)
  }
`;
