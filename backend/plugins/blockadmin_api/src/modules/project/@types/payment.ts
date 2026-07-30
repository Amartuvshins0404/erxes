import { Document } from 'mongoose';
import { IBlock } from '~/types';

export interface IProjectPaymentPlan extends IBlock {
  name?: string;
  type: BlockProjectPaymentPlanType;
  interestPercentage?: number;
  completionPaymentPercentage?: number;
  downPaymentPercentage?: number;
  discountPercentage?: number;
  project: string;
  description?: string;
  installment?: number;
  frequency?: string;
  penaltyPercentage?: number;
  vatIncluded?: boolean;
}

export interface IProjectPaymentPlanDocument
  extends IProjectPaymentPlan,
    Document {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum BlockProjectPaymentPlanFrequency {
  ONE_TIME = 'ONE_TIME',
  ONE_TIME_PER_MONTH = 'ONE_TIME_PER_MONTH',
  TWO_TIME_PER_MONTH = 'TWO_TIME_PER_MONTH',
  THREE_TIME_PER_MONTH = 'THREE_TIME_PER_MONTH',
  QUARTERLY = 'QUARTERLY',
  HALF_YEARLY = 'HALF_YEARLY',
  YEARLY = 'YEARLY',
}

export enum BlockProjectPaymentPlanInterestType {
  SIMPLE = 'SIMPLE',
  FLAT = 'FLAT',
  REDUCING = 'REDUCING',
}

export enum BlockProjectPaymentPlanType {
  PRE_ORDER = 'RESERVATION', // Урьдчилан Захиалгын гэрээ
  APARTMENT_PRE_ORDER = 'PRE_SALE', // Орон сууц захиалгын гэрээ
  HIRE_PURCHASE = 'HIRE_PURCHASE', // Хувь лизинг (зээлээр хэсэгчилсэн төлбөр)
  LOAN_PRE_ORDER = 'LOAN_RESERVATION', // Зээлээр захиалан бариулах гэрээ
  INTEREST_FREE_HIRE = 'INTEREST_FREE_HIRE', // Хувь лизинг (хүүгүй)
  BARTER = 'BARTER', // Арилжааны гэрээ (бартер)
  BANK_HOUSING_LOAN = 'BANK_HOUSING_LOAN', // Банкны орон сууцны зээл
  BANK_MORTGAGE = 'BANK_MORTGAGE', // Банкны моргейж зээл
  SALE = 'SALE', // Худалдах, худалдан авах гэрээ
  SALE_BARTER = 'SALE_BARTER', // Худалдах, худалдан авах гэрээ (бартер)
}
