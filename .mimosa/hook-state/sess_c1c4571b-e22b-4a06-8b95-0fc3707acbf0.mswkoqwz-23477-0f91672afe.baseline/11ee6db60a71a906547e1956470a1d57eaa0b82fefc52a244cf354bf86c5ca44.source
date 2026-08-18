import { IPageInfo } from 'ui-modules';

export interface IDeveloperAddress {
  address: {
    countryCode: string;
    country: string;
    postCode: string;
    city: string;
    city_district: string;
    suburb: string;
    road: string;
    street: string;
    building: string;
    number: string;
    other: string;
  };
  location: {
    type: string;
    coordinates: number[];
  };
  short: string;
}

export interface IDeveloper {
  _id: string;
  name: string;
  description: string;
  logo: string;
  coverImage: string;
  about: string;
  website: string;
  registrationNumber: string;
  address: IDeveloperAddress;
  dateFounded: string;
  primaryEmail: string;
  primaryPhone: string;
  phones: string[];
  socialLinks: {
    facebook: string;
    twitter: string;
    instagram: string;
    linkedin: string;
    youtube: string;
  };
  verificationStatus: string;
  projectsCount: number;
}

export interface IDeveloperList {
  list: IDeveloper[];
  pageInfo: IPageInfo;
  totalCount: number;
}
