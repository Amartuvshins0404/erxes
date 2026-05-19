export interface IContractStatus {
  name: string;
  projectId: string;
  description?: string;
  color?: string;
  type: string;
  order?: number;
}

export interface IContractStatusDocument extends IContractStatus, Document {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}
