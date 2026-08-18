import { z } from 'zod';

export const buildingSchema = z.object({
  name: z.string().min(1),
  types: z.array(z.string()).min(1),
  description: z.string().optional(),
  coverImage: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  status: z.string().optional(),
});

export const buildingZoneSchema = z.object({
  floor: z.number(),
  size: z.number(),
  areaType: z.string().min(1),
  tenureTypes: z.array(z.string()),
  usageTypes: z.array(z.string()).min(1),
});

export const generateByFloorRangeSchema = z
  .object({
    minFloor: z.number(),
    maxFloor: z.number(),
    size: z.number().optional(),
    areaType: z.string().min(1),
    tenureTypes: z.array(z.string()),
    usageTypes: z.array(z.string()).min(1),
  })
  .refine((data) => data.minFloor < data.maxFloor, {
    message: 'Min floor must be less than max floor',
    path: ['minFloor', 'maxFloor'],
  });
