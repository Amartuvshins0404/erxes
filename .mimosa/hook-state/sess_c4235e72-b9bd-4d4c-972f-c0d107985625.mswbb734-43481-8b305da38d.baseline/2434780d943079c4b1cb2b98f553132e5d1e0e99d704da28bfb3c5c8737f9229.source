import { gql } from '@apollo/client';

export const GET_OPPTY = gql`
  query BlockGetOppty($_id: String!) {
    blockGetOppty(_id: $_id) {
      _id
      number
      description
      customerId
      unitType
      tenureType
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
`;
