import { gql } from '@apollo/client';

export const BTK_GET_NEWS = gql`
  query BtkGetAllNews {
    btkGetAllNews {
      _id
      name
      coverImage
      title
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
  query BtkGetNews($id: String!) {
    btkGetNews(_id: $id) {
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
  query BtkGetNewsList {
    btkGetAllNews {
      _id
      name
    }
  }
`;

export const BTK_GET_NEWS_MEMBERS = gql`
  query BtkGetNewsMembers($news: String!) {
    btkGetNewsMembers(news: $news) {
      _id
      memberId
      news
      role
    }
  }
`;

export const BTK_GET_COMPANY = gql`
  query GetCompanyCompanies {
    getCompanyCompanies {
      _id
      name
      logo
      coverImage
      description
      website
      address
      phones
      socialLinks {
        facebook
        instagram
        twitter
        linkedin
        youtube
        website
      }
      verificationStatus
    }
  }
`;
