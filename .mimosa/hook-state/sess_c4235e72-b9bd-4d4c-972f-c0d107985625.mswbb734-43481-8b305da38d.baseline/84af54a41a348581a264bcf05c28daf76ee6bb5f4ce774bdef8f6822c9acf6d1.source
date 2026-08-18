import { gql } from '@apollo/client';
import { GQL_PAGE_INFO } from 'erxes-ui';

export const GET_CV_CLIENT_DETAIL = gql`
  query GetCVClient($id: String!) {
    cvGetClient(_id: $id) {
      _id
      name
      client_type
      lead_source
      registration_number
      operational_address
      business_type
      business_category
      status
      cvh_broker
      existing_insurance_policies
      claim_history_file
      description
      registered_date
      isActive
      bor_file
      service_agreement_file
      insurance_types
      contacts {
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

export const GET_CV_CLIENTS = gql`
  query CvGetClients(
    $filter: CVClientFilterInput
    $limit: Int
    $cursor: String
    $cursorMode: CURSOR_MODE
    $direction: CURSOR_DIRECTION
    $orderBy: JSON
    $sortMode: String
    $aggregationPipeline: [JSON]
  ) {
    cvGetClients(
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
        client_type
        lead_source
        registration_number
        operational_address
        business_type
        business_category
        status
        cvh_broker
        claim_history_file
        registered_date
        isActive
        bor_file
        service_agreement_file
        insurance_types
        createdAt
        updatedAt
      }
      ${GQL_PAGE_INFO}
    }
  }
`;
