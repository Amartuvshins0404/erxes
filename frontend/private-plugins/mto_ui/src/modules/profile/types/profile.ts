export type ProfileStatus = 'pending' | 'approved' | 'rejected';

export interface MtoMultilingualString {
  en: string;
  mn: string;
}

export interface MtoMultilingualStringOptional {
  en?: string;
  mn?: string;
}

export interface MtoContactInfo {
  phone?: string;
  email?: string;
  website?: string;
}

export interface MtoProfile {
  _id: string;
  createdAt?: string;
  modifiedAt?: string;
  businessName?: MtoMultilingualString;
  description?: MtoMultilingualStringOptional;
  contactInfo?: MtoContactInfo;
  status?: ProfileStatus;
  rejectionReason?: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectedBy?: string;
  isActive?: boolean;
  icon?: string;
  coverImages?: string[];
  address?: string;
  certificateNo?: string;
  instanceId?: string;
}

export interface ProfileMutationVariables {
  businessName: MtoMultilingualString;
  description?: MtoMultilingualStringOptional;
  contactInfo: {
    phone: string;
    email: string;
    website?: string;
  };
  isActive: boolean;
  icon?: string;
  coverImages: string[];
  address?: string;
  certificateNo?: string;
}
