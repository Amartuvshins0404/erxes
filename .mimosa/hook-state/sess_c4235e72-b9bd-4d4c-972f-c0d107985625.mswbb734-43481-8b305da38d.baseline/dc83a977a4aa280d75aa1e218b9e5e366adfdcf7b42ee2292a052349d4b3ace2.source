import { gql } from '@apollo/client';

export const ONE_FIT_BANNER_CREATE = gql`
  mutation OneFitBannerCreate(
    $image: String!
    $providerId: String!
    $type: String!
    $status: String
  ) {
    oneFitBannerCreate(
      image: $image
      providerId: $providerId
      type: $type
      status: $status
    ) {
      _id
      createdAt
      modifiedAt
      image
      providerId
      type
      status
    }
  }
`;

export const ONE_FIT_BANNER_UPDATE = gql`
  mutation OneFitBannerUpdate(
    $_id: String!
    $image: String
    $providerId: String
    $type: String
    $status: String
  ) {
    oneFitBannerUpdate(
      _id: $_id
      image: $image
      providerId: $providerId
      type: $type
      status: $status
    ) {
      _id
      modifiedAt
      image
      providerId
      type
      status
    }
  }
`;

export const ONE_FIT_BANNERS_REMOVE = gql`
  mutation OneFitBannersRemove($ids: [String]!) {
    oneFitBannersRemove(ids: $ids)
  }
`;
