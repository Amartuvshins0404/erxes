import { gql } from '@apollo/client';
import { GQL_PAGE_INFO } from 'erxes-ui';

export const GET_CV_MARKET_DETAIL = gql`
  query GetCVMarket($id: String!) {
    cvGetMarket(_id: $id) {
      _id
      name
      description
      registration_number
      operational_address
      type
      specialization
      region
      country
      onboarded
      onboarded_date
      onboarding_status
      business_partner_questionnaire_sent
      business_partner_questionnaire_received
      certificate_of_incorporation_sent
      certificate_of_incorporation_received
      business_license_sent
      business_license_received
      audited_financial_reports_sent
      audited_financial_reports_received
      ownership_chart_sent
      ownership_chart_received
      compliance_policies_sent
      compliance_policies_received
      tob_sent
      tob_received
      contacts {
        name
        position
        phone_number
        email
      }
      claim_handling_contact {
        name
        position
        phone_number
        email
      }
      createdAt
      updatedAt
    }
  }
`;

export const GET_CV_MARKETS = gql`
  query CvGetMarkets(
    $filter: CVMarketFilterInput
    $limit: Int
    $cursor: String
    $cursorMode: CURSOR_MODE
    $direction: CURSOR_DIRECTION
    $orderBy: JSON
    $sortMode: String
    $aggregationPipeline: [JSON]
  ) {
    cvGetMarkets(
      filter: $filter
      limit: $limit
      cursor: $cursor
      cursorMode: $cursorMode
      direction: $direction
      orderBy: $orderBy
      sortMode: $sortMode
      aggregationPipeline: $aggregationPipeline
    ) {
      list {
        _id
        name
        type
        specialization
        region
        country
        registration_number
        operational_address
        onboarding_status
        createdAt
        updatedAt
      }
      ${GQL_PAGE_INFO}
    }
  }
`;
