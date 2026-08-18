import { z } from 'zod';

export const riskGroupSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  client: z.string().min(1, { message: 'Client is required' }),
  effective_date: z.date({ required_error: 'Effective date is required' }),
  expiration_date: z.date({ required_error: 'Expiration date is required' }),
});

