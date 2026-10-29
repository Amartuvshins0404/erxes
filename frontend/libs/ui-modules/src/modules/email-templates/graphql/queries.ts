import { gql } from '@apollo/client';
import {
  GQL_CURSOR_PARAM_DEFS,
  GQL_CURSOR_PARAMS,
  GQL_PAGE_INFO,
} from 'erxes-ui';

export const EMAIL_TEMPLATE_PICKER_QUERY = gql`
  query frontlineMailEmailTemplates(
    $searchValue: String
    ${GQL_CURSOR_PARAM_DEFS}
  ) {
    emailTemplates(
      searchValue: $searchValue
      ${GQL_CURSOR_PARAMS}
    ) {
      list {
        _id
        name
        description
        content
        contentJson
        contentFormat
      }
      ${GQL_PAGE_INFO}
    }
  }
`;

export const EMAIL_TEMPLATE_CONTENT_QUERY = gql`
  query frontlineMailEmailTemplateContent(
    $content: String
    $contentFormat: String
  ) {
    emailContentPreview(content: $content, contentFormat: $contentFormat)
  }
`;
