import {
  BLOCK_REMOVE_UNIT,
  BLOCK_REMOVE_UNITS,
} from '@/unit/graphql/unitMutations';
import { useMutation } from '@apollo/client';

export const useUnitRemove = () => {
  const [removeUnit] = useMutation(BLOCK_REMOVE_UNIT);
  const [removeUnits] = useMutation(BLOCK_REMOVE_UNITS);
  return { removeUnit, removeUnits };
};
