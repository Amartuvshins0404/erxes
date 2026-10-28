import { sendTRPCMessage } from 'erxes-api-shared/utils';

export interface IStructureNode {
  _id: string;
  order: string;
  title: string;
  code?: string;
}

export interface IPlacedLine {
  placeEntityId?: string;
  responsibleEntityId?: string;
}

export interface IPrintGroup<L, C> {
  condition: C;
  lines: L[];
}

export const getStructureNodesById = async (
  subdomain: string,
  ids: (string | undefined)[],
): Promise<Record<string, IStructureNode>> => {
  const entityIds = [...new Set(ids.filter((id): id is string => !!id))];

  if (!entityIds.length) {
    return {};
  }

  const nodes: IStructureNode[] = await sendTRPCMessage({
    subdomain,
    pluginName: 'core',
    module: 'structureEntities',
    action: 'find',
    method: 'query',
    input: {
      query: { _id: { $in: entityIds } },
      fields: { _id: 1, order: 1, title: 1, code: 1 },
    },
    defaultValue: [],
  });

  return Object.fromEntries(nodes.map((node) => [node._id, node]));
};

const NO_MATCH = -1;

const pathIdsOf = (order?: string) => (order || '').split('/').filter(Boolean);

const closeness = (
  nodeById: Record<string, IStructureNode>,
  lineEntityId?: string,
  conditionEntityId?: string,
) => {
  if (!conditionEntityId) {
    return lineEntityId ? NO_MATCH : 0;
  }

  if (!lineEntityId) {
    return NO_MATCH;
  }

  if (lineEntityId === conditionEntityId) {
    return Number.MAX_SAFE_INTEGER;
  }

  return pathIdsOf(nodeById[lineEntityId]?.order).indexOf(conditionEntityId);
};

const findClosestConditionIndex = <C extends IPlacedLine>(
  line: IPlacedLine,
  conditions: C[],
  nodeById: Record<string, IStructureNode>,
) => {
  let bestIndex = NO_MATCH;
  let bestScore: [number, number] = [NO_MATCH, NO_MATCH];

  conditions.forEach((condition, index) => {
    const place = closeness(
      nodeById,
      line.placeEntityId,
      condition.placeEntityId,
    );
    const responsible = closeness(
      nodeById,
      line.responsibleEntityId,
      condition.responsibleEntityId,
    );

    if (place === NO_MATCH || responsible === NO_MATCH) {
      return;
    }

    const [bestPlace, bestResponsible] = bestScore;

    if (
      place > bestPlace ||
      (place === bestPlace && responsible > bestResponsible)
    ) {
      bestIndex = index;
      bestScore = [place, responsible];
    }
  });

  return bestIndex;
};

export const groupLinesByPrintCondition = <
  L extends IPlacedLine,
  C extends IPlacedLine,
>(
  lines: L[],
  conditions: C[],
  nodeById: Record<string, IStructureNode>,
): IPrintGroup<L, C>[] => {
  const linesByCondition: L[][] = conditions.map(() => []);

  for (const line of lines) {
    const index = findClosestConditionIndex(line, conditions, nodeById);

    if (index !== NO_MATCH) {
      linesByCondition[index].push(line);
    }
  }

  return conditions
    .map((condition, index) => ({ condition, lines: linesByCondition[index] }))
    .filter((group) => group.lines.length);
};
