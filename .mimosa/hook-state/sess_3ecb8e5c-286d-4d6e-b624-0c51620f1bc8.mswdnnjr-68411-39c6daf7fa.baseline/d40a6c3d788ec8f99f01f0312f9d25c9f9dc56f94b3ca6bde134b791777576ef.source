export interface ICVMarket {
  _id: string;
  name: string;
  type: string;
  specialization: string;
  region: string;
  country: string;
  registration_number: string;
  operational_address: string;
  onboarding_status: string;
}

export interface ICVMarketContact {
  name: string;
  position: string;
  phone_number: string;
  email: string;
}

export interface ICVMarketDetail extends ICVMarket {
  description: string;
  onboarded: boolean;
  onboarded_date: string;
  business_partner_questionnaire_sent: boolean;
  business_partner_questionnaire_received: boolean;
  certificate_of_incorporation_sent: boolean;
  certificate_of_incorporation_received: boolean;
  business_license_sent: boolean;
  business_license_received: boolean;
  audited_financial_reports_sent: boolean;
  audited_financial_reports_received: boolean;
  ownership_chart_sent: boolean;
  ownership_chart_received: boolean;
  compliance_policies_sent: boolean;
  compliance_policies_received: boolean;
  tob_sent: boolean;
  tob_received: boolean;
  contacts: ICVMarketContact[];
  claim_handling_contact: ICVMarketContact;
  createdAt: string;
  updatedAt: string;
}

