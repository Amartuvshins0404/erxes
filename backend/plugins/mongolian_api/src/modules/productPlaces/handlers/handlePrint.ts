import { graphqlPubsub } from 'erxes-api-shared/utils';
import {
  getStructureNodesById,
  groupLinesByPrintCondition,
} from '../utils/structure';
import { getCustomer } from '../utils/utils';

export const handlePrint = async (
  subdomain,
  deal,
  user,
  productsData,
  printConfig,
  productById,
  sessionCode = '',
) => {
  const { customerCode, customerName } = await getCustomer(subdomain, deal);

  const conditions = printConfig.conditions || [];
  const nodeById = await getStructureNodesById(
    subdomain,
    [...productsData, ...conditions].flatMap((item) => [
      item.placeEntityId,
      item.responsibleEntityId,
    ]),
  );

  const groups = conditions.length
    ? groupLinesByPrintCondition(productsData, conditions, nodeById)
    : [{ condition: {}, lines: productsData }];

  const content = groups.map(({ condition, lines }) => ({
    placeEntityId: condition.placeEntityId || null,
    place: nodeById[condition.placeEntityId] || null,
    responsibleEntityId: condition.responsibleEntityId || null,
    responsible: nodeById[condition.responsibleEntityId] || null,
    date: new Date(),
    name: deal.name,
    number: deal.number,
    customerCode,
    customerName,
    pDatas: lines.map((line) => ({
      ...line,
      product: productById[line.productId],
    })),
    amount: lines.reduce((sum, line) => sum + line.amount, 0),
    headerText: printConfig.headerText,
    footerText: printConfig.footerText,
  }));

  if (!content.length) {
    return;
  }

  await graphqlPubsub.publish(`productPlacesResponded:${user}`, {
    productPlacesResponded: {
      userId: user,
      responseId: deal._id,
      sessionCode,
      content,
    },
  });
};
