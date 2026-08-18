import { gql } from '@apollo/client';

export const MTO_EVENTS = gql`
  query MtoEvents(
    $status: String
    $isActive: Boolean
    $searchValue: String
    $startDateFrom: Date
    $startDateTo: Date
    $categoryId: String
  ) {
    mtoEvents(
      status: $status
      isActive: $isActive
      searchValue: $searchValue
      startDateFrom: $startDateFrom
      startDateTo: $startDateTo
      categoryId: $categoryId
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
      categories {
        _id
        name {
          en
          mn
        }
      }
      status
      isActive
      createdAt
      modifiedAt
    }
  }
`;

export const MTO_EVENT = gql`
  query MtoEvent($_id: String!) {
    mtoEvent(_id: $_id) {
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
      categories {
        _id
        name {
          en
          mn
        }
      }
      status
      isActive
      createdAt
      modifiedAt
    }
  }
`;
