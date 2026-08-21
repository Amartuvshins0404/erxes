export const types = `
  type AgencyOperationArea {
    city: String
    district: String
  }

  type AgencyFieldOfExpertise {
    propertyTypes: [String]
    services: [String]
    clientTypes: [String]
  }

  enum AgencyVerificationStatus {
    unverified
    pending
    verified
  }

  type BlockAgency {
    _id: String
    name: String
    brandName: String
    type: String
    description: String
    brief: String
    website: String
    emails: [String]
    primaryEmail: String
    phones: [String]
    primaryPhone: String
    logo: Attachment
    coverImage: Attachment
    documents: [Attachment]
    socialLinks: JSON
    dateFounded: String
    operationArea: AgencyOperationArea
    fieldsOfExpertise: AgencyFieldOfExpertise
    messengerIntegrationId: String
    widgetBundleUrl: String
    verificationStatus: AgencyVerificationStatus
    rejectionReasons: [String]
    rejectionNotes: String
  }

  type BlockAgencyVerificationStatus {
    _id: String
    verificationStatus: AgencyVerificationStatus
    rejectionReasons: [String]
    rejectionNotes: String
  }

  input AgencyContactInfoInput {
    email: String
    phone: String
    website: String
  }

  input AgencyOperationAreaInput {
    city: String
    district: String
  }

  input AgencyFieldOfExpertiseInput {
    propertyTypes: [String]
    services: [String]
    clientTypes: [String]
  }

  input AgencyInput {
    name: String
    brandName: String
    type: String
    description: String
    brief: String
    website: String
    emails: [String]
    primaryEmail: String
    phones: [String]
    primaryPhone: String
    logo: AttachmentInput
    coverImage: AttachmentInput
    documents: [AttachmentInput]
    socialLinks: JSON
    dateFounded: String
    operationArea: AgencyOperationAreaInput
    fieldsOfExpertise: AgencyFieldOfExpertiseInput
    messengerIntegrationId: String
    widgetBundleUrl: String
  }
`;

export const queries = `
  getAgencyInfo: BlockAgency
  getAgencies: [BlockAgency]
  getAgencyVerificationStatus: BlockAgencyVerificationStatus
`;

export const mutations = `
  updateAgencyInfo(input: AgencyInput): BlockAgency
  updateAgencyVerificationStatus: BlockAgency
`;
