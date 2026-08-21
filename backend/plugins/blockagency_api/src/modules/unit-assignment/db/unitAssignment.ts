import { Schema, Model, Document } from 'mongoose';

export type BlockUnitStatus =
  | 'vacant'
  | 'reserved'
  | 'leased'
  | 'leaseExpireSoon'
  | 'leaseRenewal'
  | 'underFitout'
  | 'cancelled'
  | 'internalUse'
  | 'onHold';

export interface IBlockUnitAssignment {
  blockUnitId: string;
  agencyId: string;
  blockSubdomain: string;
  agencySubdomain: string;
  blockDeveloperName?: string;
  unitNumber?: string;
  projectId?: string;
  memberId?: string;
  status?: BlockUnitStatus;
  assignedAt: Date;
}

export interface IBlockUnitAssignmentDocument
  extends IBlockUnitAssignment,
    Document {}

export type IBlockUnitAssignmentModel = Model<IBlockUnitAssignmentDocument>;

export const blockUnitAssignmentSchema =
  new Schema<IBlockUnitAssignmentDocument>(
    {
      blockUnitId: { type: String, required: true, index: true },
      agencyId: { type: String, required: true, index: true },
      blockSubdomain: { type: String, required: true },
      agencySubdomain: { type: String, required: true },
      blockDeveloperName: { type: String },
      unitNumber: { type: String },
      projectId: { type: String, index: true },
      memberId: { type: String, index: true },
      status: {
        type: String,
        enum: [
          'vacant',
          'reserved',
          'leased',
          'leaseExpireSoon',
          'leaseRenewal',
          'underFitout',
          'cancelled',
          'internalUse',
          'onHold',
        ],
        default: 'vacant',
        index: true,
      },
      assignedAt: { type: Date, default: Date.now },
    },
    { timestamps: true },
  );

blockUnitAssignmentSchema.index(
  { blockUnitId: 1, agencyId: 1 },
  { unique: true },
);
