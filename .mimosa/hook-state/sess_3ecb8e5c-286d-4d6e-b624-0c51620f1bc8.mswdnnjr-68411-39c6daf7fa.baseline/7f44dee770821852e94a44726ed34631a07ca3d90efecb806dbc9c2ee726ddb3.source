import { z } from 'zod';

export const addUnitSchema = z
  .object({
    number: z.string().min(1),
    type: z.string().min(1),
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
  .refine((data) => data.useProjectPrice || data.mainPrice !== undefined, {
    message: 'Please provide a main price when the project price is not used',
    path: ['mainPrice'],
  })
  .refine(
    (data) => data.useProjectPrice || (data.prices && data.prices.length > 0),
    {
      message: 'Please provide prices when the project price is not used',
      path: ['prices'],
    },
  );

export const addUnitsMultipleSchema = z.object({
  units: z.array(z.object({ unitType: z.string() })).min(1),
  zoneRange: z.array(z.number()).min(2).max(2),
});
