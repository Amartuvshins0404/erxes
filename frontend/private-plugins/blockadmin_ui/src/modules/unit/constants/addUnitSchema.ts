import { z } from 'zod';

export const addUnitSchema = z
  .object({
    number: z.string().min(1),
    type: z.string().min(1),
    size: z.number(),
    useProjectPrice: z.boolean(),
    mainPrice: z.number().optional(),
    prices: z
      .array(
        z.object({
          currency: z.string().min(1),
          price: z.number(),
          priceType: z.enum(['priceBySize', 'priceByUnit']),
        }),
      )
      .optional(),
  })
  .refine((data) => !data.useProjectPrice && !data.mainPrice, {
    message: 'Please provide a main price when the project price is not used',
    path: ['mainPrice'],
  })
  .refine((data) => !data.useProjectPrice && !data.prices, {
    message: 'Please provide prices when the project price is not used',
    path: ['prices'],
  });

export const addUnitsMultipleSchema = z.object({
  type: z.string().min(1),
  size: z.number(),
  count: z.number(),
});
