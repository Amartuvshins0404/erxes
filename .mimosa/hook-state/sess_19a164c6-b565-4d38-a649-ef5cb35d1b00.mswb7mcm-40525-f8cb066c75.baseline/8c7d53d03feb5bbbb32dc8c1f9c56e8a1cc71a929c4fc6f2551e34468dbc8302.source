import { gql } from '@apollo/client';

export const UPDATE_OPPTY_MUTATION = gql`
  mutation BlockUpdateOppty($_id: String!, $input: IBlockOpptyInput!) {
    blockUpdateOppty(_id: $_id, input: $input) {
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
