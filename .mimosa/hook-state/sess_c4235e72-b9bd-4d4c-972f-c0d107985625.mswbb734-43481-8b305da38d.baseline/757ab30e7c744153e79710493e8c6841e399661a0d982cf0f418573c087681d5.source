import { gql } from '@apollo/client';

export const ASSIGN_UNIT_TO_MEMBER = gql`
  mutation BlockAgencyAssignUnitToMember($_id: String!, $memberId: String) {
    blockAgencyAssignUnitToMember(_id: $_id, memberId: $memberId) {
      _id
      memberId
    }
  }
`;

export const UPDATE_UNIT_STATUS = gql`
  mutation BlockAgencyUpdateUnitStatus(
    $_id: String!
    $status: BlockUnitStatus!
  ) {
    blockAgencyUpdateUnitStatus(_id: $_id, status: $status) {
      _id
      status
    }
  }
`;
