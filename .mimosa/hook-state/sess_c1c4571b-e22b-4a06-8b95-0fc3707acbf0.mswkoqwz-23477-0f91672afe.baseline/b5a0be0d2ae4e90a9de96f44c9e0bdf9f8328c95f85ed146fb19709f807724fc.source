import { gql } from '@apollo/client';

export const MUSHOP_COLLECTIVE_DETAIL = gql`
  query MushopCollectiveDetail($_id: String!) {
    mushopCollectiveDetail(_id: $_id) {
      _id
      name
      description
      targetSubdomain
      supplierIds
      suppliers {
        _id
        name
        logo
        verificationStatus
      }
      status
      syncResults {
        supplierId
        supplier {
          _id
          name
          logo
          verificationStatus
        }
        subdomain
        total
        created
        failed
        errors
      }
      totalCreated
      totalFailed
      lastSyncedAt
      createdBy
      createdAt
      updatedAt
    }
  }
`;
