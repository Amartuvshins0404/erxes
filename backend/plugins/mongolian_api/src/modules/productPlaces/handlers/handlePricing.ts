import { sendTRPCMessage } from 'erxes-api-shared/utils';

export const handlePricing = async (subdomain, deal, productsData) => {
  const groupedData: Record<string, Record<string, any[]>> = {};

  for (const data of productsData) {
    const { placeEntityId = '', responsibleEntityId = '' } = data;

    if (!groupedData[placeEntityId]) {
      groupedData[placeEntityId] = {};
    }
    if (!groupedData[placeEntityId][responsibleEntityId]) {
      groupedData[placeEntityId][responsibleEntityId] = [];
    }

    groupedData[placeEntityId][responsibleEntityId].push(data);
  }

  let isSetPricing = false;
  let afterPricingData: any[] = [];

  for (const placeEntityId of Object.keys(groupedData)) {
    for (const responsibleEntityId of Object.keys(groupedData[placeEntityId])) {
      const perDatas = groupedData[placeEntityId][responsibleEntityId];

      if (!perDatas.length) {
        continue;
      }

      const pricing = await sendTRPCMessage({
        subdomain,
        pluginName: 'pricing',
        module: 'pricing',
        action: 'checkPricing',
        method: 'query',
        input: {
          prioritizeRule: 'exclude',
          totalAmount: perDatas.reduce((sum, cur) => sum + cur.amount, 0),
          placeEntityId,
          responsibleEntityId,
          products: perDatas.map((i) => ({
            itemId: i._id,
            productId: i.productId,
            quantity: i.quantity,
            price: i.unitPrice,
          })),
        },
        defaultValue: {},
      });

      for (const item of perDatas) {
        const discount = pricing[item._id];
        if (!discount) {
          continue;
        }

        isSetPricing = true;

        if (discount.type === 'percentage') {
          item.discountPercent = Number.parseFloat(
            ((discount.value / (item.unitPrice || 1)) * 100).toFixed(2),
          );
        }

        item.discount = discount.value * item.quantity;
        item.amount =
          ((item.globalUnitPrice || item.unitPrice) - discount.value) *
          item.quantity;
      }

      afterPricingData = afterPricingData.concat(perDatas);
    }
  }

  if (isSetPricing) {
    await sendTRPCMessage({
      subdomain,
      pluginName: 'sales',
      module: 'deal',
      action: 'updateOne',
      method: 'mutation',
      input: {
        selector: { _id: deal._id },
        modifier: { $set: { productsData: afterPricingData } },
      },
    });
  }

  return afterPricingData;
};
