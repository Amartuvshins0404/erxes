import { gql } from '@apollo/client';

export const ONE_FIT_CITIES_ADMIN = gql`
  query OneFitCitiesAdmin($isActive: Boolean, $searchValue: String) {
    oneFitCitiesAdmin(isActive: $isActive, searchValue: $searchValue) {
      _id
      name {
        en
        mn
      }
      code
      isActive
      createdAt
      modifiedAt
    }
  }
`;

export const ONE_FIT_DISTRICTS_ADMIN = gql`
  query OneFitDistrictsAdmin(
    $cityId: String
    $isActive: Boolean
    $searchValue: String
  ) {
    oneFitDistrictsAdmin(
      cityId: $cityId
      isActive: $isActive
      searchValue: $searchValue
    ) {
      _id
      cityId
      name {
        en
        mn
      }
      code
      isActive
      createdAt
      modifiedAt
    }
  }
`;
