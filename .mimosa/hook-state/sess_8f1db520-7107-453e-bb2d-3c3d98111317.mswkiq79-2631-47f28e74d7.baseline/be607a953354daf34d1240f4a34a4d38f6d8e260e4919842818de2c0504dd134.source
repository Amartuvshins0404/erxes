import { z } from 'zod';

export const buildingSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  description: z.string().optional(),
  coverImage: z.string().optional(),
});

export const buildingZoneSchema = z.object({
  floor: z.number(),
  size: z.number(),
  tenureTypes: z.array(z.string()),
  areaType: z.string().min(1),
  usageTypes: z.array(z.string()),
});

export const generateByFloorRangeSchema = z
  .object({
    minFloor: z.number(),
    maxFloor: z.number(),
    size: z.number().optional(),
    tenureTypes: z.array(z.string()),
    areaType: z.string().min(1),
    usageTypes: z.array(z.string()),
  })
  .refine((data) => data.minFloor < data.maxFloor, {
    message: 'Min floor must be less than max floor',
    path: ['minFloor', 'maxFloor'],
  });
