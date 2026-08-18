import { BLOCK_STATUS_FORM_SCHEMA } from '@/status/schemas';
import { z } from 'zod';

export interface IBlockStatus {
  _id: string;
  name: string;
  projectId: string;
  description: string;
  color: string;
  order: number;
  type: string;
  createdAt: string;
  updatedAt: string;
}

export type TBlockStatusForm = z.infer<typeof BLOCK_STATUS_FORM_SCHEMA>;
