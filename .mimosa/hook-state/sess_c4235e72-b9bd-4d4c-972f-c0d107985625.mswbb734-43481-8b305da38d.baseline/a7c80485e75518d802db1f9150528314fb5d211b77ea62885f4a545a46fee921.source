import { z } from 'zod';

export const marketSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  description: z.string().optional(),
  registration_number: z.string().optional(),
  operational_address: z.string().optional(),
  type: z.string().optional(),
  specialization: z.string().optional(),
  region: z.string().optional(),
  country: z.string().optional(),
  onboarded: z.boolean().optional(),
  onboarded_date: z.date().optional(),
  onboarding_status: z.string().optional(),
  business_partner_questionnaire_sent: z.boolean().optional(),
  business_partner_questionnaire_received: z.boolean().optional(),
  certificate_of_incorporation_sent: z.boolean().optional(),
  certificate_of_incorporation_received: z.boolean().optional(),
  business_license_sent: z.boolean().optional(),
  business_license_received: z.boolean().optional(),
  audited_financial_reports_sent: z.boolean().optional(),
  audited_financial_reports_received: z.boolean().optional(),
  ownership_chart_sent: z.boolean().optional(),
  ownership_chart_received: z.boolean().optional(),
  compliance_policies_sent: z.boolean().optional(),
  compliance_policies_received: z.boolean().optional(),
  tob_sent: z.boolean().optional(),
  tob_received: z.boolean().optional(),
  contacts: z.array(
    z.object({
      email: z.string().optional(),
      name: z.string().optional(),
      phone_number: z.string().optional(),
      position: z.string().optional(),
    }),
  ),
  claim_handling_contact: z
    .object({
      email: z.string().optional(),
      name: z.string().optional(),
      phone_number: z.string().optional(),
      position: z.string().optional(),
    })
    .optional(),
});
