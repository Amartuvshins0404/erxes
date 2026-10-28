import {
  getStructureNodesById,
  IPlacedLine,
} from '@/productPlaces/utils/structure';

export const getOtherCodeResolver = async (
  subdomain: string,
  lines: IPlacedLine[],
) => {
  const nodeById = await getStructureNodesById(
    subdomain,
    lines.flatMap((line) => [line.placeEntityId, line.responsibleEntityId]),
  );

  return ({ placeEntityId, responsibleEntityId }: IPlacedLine) => {
    if (!placeEntityId && !responsibleEntityId) {
      return '';
    }

    const placeCode = nodeById[placeEntityId || '']?.code || '';
    const responsibleCode = nodeById[responsibleEntityId || '']?.code || '';

    return `${placeCode}_${responsibleCode}`;
  };
};
