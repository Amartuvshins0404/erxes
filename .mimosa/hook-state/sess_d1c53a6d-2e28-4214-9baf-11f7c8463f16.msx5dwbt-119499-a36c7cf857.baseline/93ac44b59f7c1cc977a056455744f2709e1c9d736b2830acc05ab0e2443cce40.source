import { BLOCK_CONTRACT_STATUS_FORM_SCHEMA } from '@/contract-status/schemas';
import { z } from 'zod';

export interface IBlockContractStatus {
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

export type TBlockContractStatusForm = z.infer<
  typeof BLOCK_CONTRACT_STATUS_FORM_SCHEMA
>;
