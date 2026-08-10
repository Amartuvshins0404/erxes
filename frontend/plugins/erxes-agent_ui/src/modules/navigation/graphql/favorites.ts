import { gql } from '@apollo/client';

// Core's organization/settings favorites API, reached over the federated
// gateway. ui-modules keeps its own copies of these documents but does not
// export them, so the plugin holds its own. A favorited agent is stored as a
// `submenu` favorite whose path is the agent's chat route and whose `label` is
// the agent's name — core's global Favorites renderer reads that label to show
// the agent as an individual item in the sidebar Favorites section.
export const GET_FAVORITES_BY_CURRENT_USER = gql`
  query getFavoritesByCurrentUser {
    getFavoritesByCurrentUser {
      _id
      type
      path
      label
    }
  }
`;

export const TOGGLE_FAVORITE = gql`
  mutation toggleFavorite($type: String!, $path: String!, $label: String) {
    toggleFavorite(type: $type, path: $path, label: $label) {
      _id
      label
    }
  }
`;
