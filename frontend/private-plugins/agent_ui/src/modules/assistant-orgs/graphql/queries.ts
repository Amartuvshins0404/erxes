import { gql } from '@apollo/client';

export const GET_IDENTIFIERS = gql`
  query GetIdentifiers($kind: String) {
    getIdentifiers(kind: $kind) {
      _id
      name
      slug
      kind
      description
      createdUserId
      memberIds
      createdAt
      updatedAt
    }
  }
`;

export const GET_IDENTIFIER = gql`
  query GetIdentifier($identifierId: String!) {
    getIdentifier(identifierId: $identifierId) {
      _id
      name
      slug
      kind
      description
      createdUserId
      memberIds
      createdAt
      updatedAt
    }
  }
`;

export const AGENT_ASSISTANT_LIMIT = gql`
  query AgentAssistantLimit {
    agentAssistantLimit {
      limited
      allowed
      limit
      used
      remaining
      hasActivePlan
      source
      upgradeUrl
      billingWarning {
        active
        deletionDue
        gracePeriodDays
        daysUntilDeletion
        unpaidSince
        deletionDate
        message
      }
      billingOverview {
        active
        blocked
        overdueCount
        billingUrl
        message
        items {
          identifierId
          name
          slug
          description
          memberIds
          createdAt
          updatedAt
          planStartDate
          planEndDate
          paymentStatus
          blocked
          planActive
          overdueDays
          message
        }
      }
    }
  }
`;

export const GET_ASSISTANT_ORGS = GET_IDENTIFIERS;
export const GET_ASSISTANT_ORG = GET_IDENTIFIER;
