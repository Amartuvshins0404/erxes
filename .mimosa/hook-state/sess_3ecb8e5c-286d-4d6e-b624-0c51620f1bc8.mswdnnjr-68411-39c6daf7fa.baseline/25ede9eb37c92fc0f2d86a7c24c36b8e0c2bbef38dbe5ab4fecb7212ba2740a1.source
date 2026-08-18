import { z } from 'zod';
import {
  CLIENT_LEAD_SOURCE_OPTIONS,
  CLIENT_STATUS_OPTIONS,
} from './clientTypes';

export const clientFormSchema = z.object({
  bor_file: z.string().optional(),
  business_category: z
    .string()
    .min(1, { message: 'Business category is required' }),
  business_type: z.string().min(1, { message: 'Business type is required' }),
  claim_history_file: z.string().optional(),
  client_type: z.string().min(1, { message: 'Client type is required' }),
  contacts: z.array(
    z.object({
      email: z.string().email({ message: 'Invalid email' }).optional(),
      name: z.string().min(1, { message: 'Name is required' }),
      phone_number: z.string().min(1, { message: 'Phone number is required' }),
      position: z.string().optional(),
    }),
  ),
  cvh_broker: z.string().min(1, { message: 'CVH broker is required' }),
  description: z.string().min(1, { message: 'Description is required' }),
  existing_insurance_policies: z.string().optional(),
  insurance_types: z
    .array(z.string())
    .min(1, { message: 'Insurance types are required' }),
  isActive: z.boolean().optional(),
  lead_source: z.enum(
    CLIENT_LEAD_SOURCE_OPTIONS.map((option) => option.value) as [
      string,
      ...string[],
    ],
    { message: 'Lead source is required' },
  ),
  name: z.string().min(1, { message: 'Name is required' }),
  operational_address: z.string().optional(),
  registered_date: z.string().optional(),
  registration_number: z
    .string()
    .min(7, {
      message: 'Registration number must be 7 characters long',
    })
    .max(7, {
      message: 'Registration number must be at least 7 characters long',
    }),
  service_agreement_file: z.string().optional(),
  status: z
    .enum(
      CLIENT_STATUS_OPTIONS.map((option) => option.value) as [
        string,
        ...string[],
      ],
    )
    .optional(),
});

// {
//   "input": {
//     "bor_file": null,
//     "business_category": null,
//     "business_type": null,
//     "claim_history_file": null,
//     "client_type": null,
//     "contacts": [
//       {
//         "email": null,
//         "name": null,
//         "phone_number": null,
//         "position": null
//       }
//     ],
//     "cvh_broker": null,
//     "description": null,
//     "existing_insurance_policies": null,
//     "insurance_types": null,
//     "isActive": null,
//     "lead_source": null,
//     "name": null,
//     "operational_address": null,
//     "registered_date": null,
//     "registration_number": null,
//     "service_agreement_file": null,
//     "status": null
//   }
// }
