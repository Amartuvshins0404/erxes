import { gql } from '@apollo/client';

export const OPPTY_LIST_CHANGED = gql`
  subscription blockOpptyListChanged(
    $projectId: String!
    $filter: IOpptyFilter
  ) {
    blockOpptyListChanged(projectId: $projectId, filter: $filter) {
      type
      oppty {
        _id
        number
        description
        customerId
        unitTypes
        unit
        units
        propertyRows {
          buildingId
          zoningId
          unitId
          isMain
        }
        assignedUserId
        status
        labelIds
        tagIds
        projectId
        startDate
        targetDate
        customerSource
        propertiesData
        createdAt
        updatedAt
      }
    }
  }
`;
