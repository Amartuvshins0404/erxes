import { gql } from '@apollo/client';

export const BTK_GET_NEWS = gql`
  query BtkAdminGetAllNews {
    btkAdminGetAllNews {
      _id
      name
      coverImage
      logo
      createdAt
      updatedAt
      verificationStatus
      location {
        address
        city
        district
        lat
        lng
        parcelId
      }
    }
  }
`;

export const BTK_GET_NEWS_DETAIL = gql`
  query BtkAdminGetNews($id: String!) {
    btkAdminGetNews(_id: $id) {
      _id
      name
      isPublished
      location {
        address
        city
        district
        lat
        lng
        parcelId
      }
      verificationStatus
      companyId
      title
      content
      status
      coverImage
      logo
      images
      newsAmenities {
        amenities
        category
      }
    }
  }
`;

export const BTK_GET_NEWS_LIST = gql`
  query BtkAdminGetNewsList {
    btkAdminGetAllNews {
      _id
      name
    }
  }
`;

export const BTK_GET_NEWS_MEMBERS = gql`
  query BtkAdminGetNewsMembers($news: String!) {
    btkAdminGetNewsMembers(news: $news) {
      _id
      memberId
      news
      role
    }
  }
`;
