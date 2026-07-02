export type RegistrationApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected';

export type RegistrationPaymentStatus = 'unpaid' | 'paid' | 'manual_verified';

export interface IRegistrationApplication {
  membershipTypeId: string;
  schemaVersion: string;
  status: RegistrationApplicationStatus;
  answers: Record<string, unknown>;
  subdomain: string;
  instanceId?: string;
  cpUserId?: string;
  isRead?: boolean;
  invoiceId?: string;
  paymentStatus?: RegistrationPaymentStatus;
  membershipFeeAmount?: number;
}
