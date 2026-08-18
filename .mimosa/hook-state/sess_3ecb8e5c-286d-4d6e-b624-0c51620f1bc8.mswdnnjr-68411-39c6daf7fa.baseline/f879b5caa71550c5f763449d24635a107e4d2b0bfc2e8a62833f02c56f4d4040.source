import { gql } from '@apollo/client';

export const OPPTY_CHANGED = gql`
  subscription blockOpptyChanged($_id: String!) {
    blockOpptyChanged(_id: $_id) {
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
