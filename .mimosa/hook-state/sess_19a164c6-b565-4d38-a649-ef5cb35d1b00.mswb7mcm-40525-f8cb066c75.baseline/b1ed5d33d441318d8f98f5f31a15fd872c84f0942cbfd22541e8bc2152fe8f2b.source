import { gql } from '@apollo/client';

export const ONE_FIT_CITY_CREATE = gql`
  mutation OneFitCityCreate(
    $name: OneFitMultilingualStringInput!
    $code: String
    $isActive: Boolean
  ) {
    oneFitCityCreate(name: $name, code: $code, isActive: $isActive) {
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

export const ONE_FIT_CITY_UPDATE = gql`
  mutation OneFitCityUpdate(
    $_id: String!
    $name: OneFitMultilingualStringInput
    $code: String
    $isActive: Boolean
  ) {
    oneFitCityUpdate(_id: $_id, name: $name, code: $code, isActive: $isActive) {
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

export const ONE_FIT_CITY_REMOVE = gql`
  mutation OneFitCityRemove($_id: String!) {
    oneFitCityRemove(_id: $_id)
  }
`;

export const ONE_FIT_DISTRICT_CREATE = gql`
  mutation OneFitDistrictCreate(
    $cityId: String!
    $name: OneFitMultilingualStringInput!
    $code: String
    $isActive: Boolean
  ) {
    oneFitDistrictCreate(
      cityId: $cityId
      name: $name
      code: $code
      isActive: $isActive
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

export const ONE_FIT_DISTRICT_UPDATE = gql`
  mutation OneFitDistrictUpdate(
    $_id: String!
    $cityId: String
    $name: OneFitMultilingualStringInput
    $code: String
    $isActive: Boolean
  ) {
    oneFitDistrictUpdate(
      _id: $_id
      cityId: $cityId
      name: $name
      code: $code
      isActive: $isActive
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

export const ONE_FIT_DISTRICT_REMOVE = gql`
  mutation OneFitDistrictRemove($_id: String!) {
    oneFitDistrictRemove(_id: $_id)
  }
`;
