export interface MtoRegistrationApplication {
  _id: string;
  createdAt?: string;
  modifiedAt?: string;
  subdomain?: string;
  membershipTypeId?: string;
  membershipTypeTitle?: string;
  schemaVersion?: string;
  status?: string;
  instanceId?: string;
  cpUserId?: string | null;
  isRead?: boolean;
  paymentStatus?: string | null;
  invoiceId?: string;
  membershipFeeAmount?: number;
  archivedAt?: string | null;
}
