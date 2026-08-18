import { gql } from '@apollo/client';

export const ONE_FIT_CITIES = gql`
  query OneFitCities($isActive: Boolean) {
    oneFitCities(isActive: $isActive) {
      _id
      name {
        en
        mn
      }
      code
      isActive
    }
  }
`;

export const ONE_FIT_DISTRICTS = gql`
  query OneFitDistricts($cityId: String, $isActive: Boolean) {
    oneFitDistricts(cityId: $cityId, isActive: $isActive) {
      _id
      cityId
      name {
        en
        mn
      }
      code
      isActive
    }
  }
`;
