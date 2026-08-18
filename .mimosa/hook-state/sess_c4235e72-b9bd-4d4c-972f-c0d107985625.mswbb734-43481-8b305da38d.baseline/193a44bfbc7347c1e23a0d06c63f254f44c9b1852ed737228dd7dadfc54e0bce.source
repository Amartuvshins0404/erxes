import { gql, useQuery } from '@apollo/client';

const GET_OPPTY_UNIT_ROWS = gql`
  query BlockGetOpptyUnitRows($_id: String!) {
    blockGetOpptyUnitRows(_id: $_id) {
      unitId
      buildingId
      zoningId
    }
  }
`;

export const useUnitRows = (opptyId: string) => {
  const { data, loading } = useQuery(GET_OPPTY_UNIT_ROWS, {
    variables: { _id: opptyId },
    skip: !opptyId,
  });

  return {
    unitRows: data?.blockGetOpptyUnitRows || [],
    loading,
  };
};
