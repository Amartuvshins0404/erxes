import { IContainerAccessRule } from 'erxes-api-shared/core-modules';
import { Document } from 'mongoose';

export interface IPipeline {
  name?: string;
  boardId: string;
  status?: string;
  visibility?: string;
  memberIds?: string[];
  bgColor?: string;
  watchedUserIds?: string[];
  startDate?: Date;
  endDate?: Date;
  metric?: string;
  hackScoringType?: string;
  templateId?: string;
  isCheckDate?: boolean;
  accessRule?: IContainerAccessRule;
  numberConfig?: string;
  numberSize?: string;
  nameConfig?: string;
  lastNum?: string;
  sharedEntityIds?: string[];
  tagId?: string;
  initialCategoryIds?: string[];
  excludeCategoryIds?: string[];
  excludeProductIds?: string[];
  paymentIds?: string[];
  paymentTypes?: any[];
  propertyIds?: string[];
  isPropertySelectionConfigured?: boolean;

  userId?: string;
  order?: number;
  type: string;
}

export interface IPipelineDocument extends IPipeline, Document {
  _id: string;
  createdAt?: Date;
}
