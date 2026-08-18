import { z } from 'zod';

export const unitTypeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  size: z.number().min(0),
  type: z.string().min(1, 'Type is required'),
  subTypes: z.array(z.string()).optional(),
  featureTypes: z.array(z.string()).optional(),
  areaType: z.string(),
  tenureTypes: z.array(z.string()),
  content: z.string().optional(),
  price: z.number().optional(),
  prices: z
    .array(
      z.object({
        currency: z.string().min(1),
        price: z.number(),
        priceType: z.enum(['priceBySize', 'priceByUnit']),
      }),
    )
    .optional(),
  status: z.string().optional(),
  rooms: z
    .array(
      z.object({
        type: z.string().min(1, 'Room type is required'),
        count: z.number().min(1),
      }),
    )
    .optional(),
  roomsCount: z.number().optional(),
});
