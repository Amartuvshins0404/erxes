import { gql } from '@apollo/client';

export const CREATE_NEWS = gql`
  mutation BtkCreateNews($name: String!) {
    btkCreateNews(name: $name) {
      _id
    }
  }
`;

export const BTK_PUBLISH_NEWS = gql`
  mutation BtkPublishNews($id: String!) {
    btkPublishNews(_id: $id) {
      _id
    }
  }
`;

export const BTK_REMOVE_NEWS = gql`
  mutation BtkRemoveNews($id: String!) {
    btkRemoveNews(_id: $id) {
      _id
    }
  }
`;

export const UPDATE_NEWS_GENERAL_INFO = gql`
  mutation BtkUpdateNewsGeneralInfo(
    $id: String!
    $input: BtkNewsGeneralInput!
  ) {
    btkUpdateNewsGeneralInfo(_id: $id, input: $input) {
      _id
    }
  }
`;

export const BTK_ADD_NEWS_MEMBERS = gql`
  mutation BtkAddNewsMembers($news: String!, $memberIds: [String!]!) {
    btkAddNewsMembers(news: $news, memberIds: $memberIds) {
      _id
    }
  }
`;

export const BTK_UPDATE_NEWS_MEMBER = gql`
  mutation BtkUpdateNewsMember($id: String!, $role: BtkNewsMemberRole) {
    btkUpdateNewsMember(_id: $id, role: $role) {
      _id
    }
  }
`;

export const BTK_DELETE_NEWS_MEMBER = gql`
  mutation BtkDeleteNewsMember($id: String!) {
    btkDeleteNewsMember(_id: $id) {
      _id
    }
  }
`;
