import { Document } from 'mongoose';

export type TIdentifierKind = 'assistant' | 'agent';

export interface IIdentifier {
  name: string;
  slug: string;
  kind: TIdentifierKind;
  description?: string;
  createdUserId?: string;
  memberIds?: string[];
  planActive?: boolean;
}

export interface IIdentifierDocument extends IIdentifier, Document {
  _id: string;

  createdAt: Date;
  updatedAt: Date;
}
