import { z } from 'zod';

export const riskGroupFormSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  client: z.string().min(1, { message: 'Client is required' }),
  effective_date: z.string().min(1, { message: 'Effective date is required' }),
  expiration_date: z.string().min(1, { message: 'Expiration date is required' }),
});

