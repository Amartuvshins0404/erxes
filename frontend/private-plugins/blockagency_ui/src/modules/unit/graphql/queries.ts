import { gql } from '@apollo/client';

export const GET_AGENCY_UNITS = gql`
  query BlockAgencyGetUnits(
    $agencyId: String
    $status: BlockUnitStatus
    $page: Int
    $perPage: Int
  ) {
    blockAgencyGetUnits(
      agencyId: $agencyId
      status: $status
      page: $page
      perPage: $perPage
    ) {
      _id
      blockUnitId
      unitNumber
      agencyId
      blockSubdomain
      agencySubdomain
      blockDeveloperName
      agency {
        name
      }
      memberId
      member {
        _id
        details {
          avatar
          fullName
        }
      }
      status
      assignedAt
      createdAt
    }
  }
`;

export const GET_AGENCY_UNITS_TOTAL_COUNT = gql`
  query BlockAgencyGetUnitsTotalCount(
    $agencyId: String
    $status: BlockUnitStatus
  ) {
    blockAgencyGetUnitsTotalCount(agencyId: $agencyId, status: $status)
  }
`;

export const GET_AGENCY_UNIT_STATUS_COUNTS = gql`
  query BlockAgencyGetUnitStatusCounts($agencyId: String) {
    blockAgencyGetUnitStatusCounts(agencyId: $agencyId) {
      available
      reserved
      sold
      leased
    }
  }
`;
