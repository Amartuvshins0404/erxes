import { z } from 'zod';

export const clientSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  bor_file: z.string().optional(),
  business_category: z.string().optional(),
  business_type: z.string().optional(),
  claim_history_file: z.string().optional(),
  client_type: z.string().optional(),
  contacts: z.array(
    z.object({
      email: z.string().optional(),
      name: z.string().optional(),
      phone_number: z.string().optional(),
      position: z.string().optional(),
    }),
  ),
  cvh_broker: z.string().optional(),
  description: z.string().optional(),
  existing_insurance_policies: z.string().optional(),
  insurance_types: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  lead_source: z.string().optional(),
  operational_address: z.string().optional(),
  registered_date: z.date().optional(),
  registration_number: z.string().optional(),
  service_agreement_file: z.string().optional(),
  status: z.string().optional(),
});
