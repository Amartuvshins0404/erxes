import { IBlockAgencyDocument } from '@/agency/@types/agency';
import {
  IBlockAgencyModel,
  loadBlockAgencyClass,
} from '@/agency/db/models/Agency';
import { IBlockAdminListingDocument } from '@/listing/@types/listing';
import {
  IBlockAdminListingModel,
  loadBlockAdminListingClass,
} from '@/listing/db/models/Listing';
import { IBlockAttachmentDocument } from '@/attachment/@types/attachment';
import {
  IBlockAttachmentModel,
  loadBlockAttachmentClass,
} from '@/attachment/db/models/Attachment';
import { IBuildingDocument } from '@/building/@types/building';
import { IZoningDocument } from '@/building/@types/zoning';
import {
  IBuildingModel,
  loadBuildingClass,
} from '@/building/db/models/Building';
import { IZoningModel, loadZoningClass } from '@/building/db/models/Zoning';
import { IContractDocument } from '@/contract/@types/contract';
import { IOfferDocument } from '@/contract/@types/offer';
import {
  IContractModel,
  loadContractClass,
} from '@/contract/db/models/Contract';
import { IOfferModel, loadOfferClass } from '@/contract/db/models/Offer';
import { IContractPaymentDocument } from '@/contract/@types/payment';
import {
  IContractPaymentModel,
  loadContractPaymentClass,
} from '@/contract/db/models/Payment';
import { IBlockCustomerDocument } from '@/blockCustomer/@types/blockCustomer';
import {
  IBlockCustomerModel,
  loadBlockCustomerClass,
} from '@/blockCustomer/db/models/BlockCustomer';
import { IBlockDeveloperDocument } from '@/developer/db/@types/developer';
import {
  IBlockDeveloperModel,
  loadBlockDeveloperClass,
} from '@/developer/db/models/Developer';
import { IBlockDocumentDocument } from '@/document/@types/document';
import {
  IBlockDocumentModel,
  loadBlockDocumentClass,
} from '@/document/db/models/Document';
import { ISubmissionDocument } from '@/form/@types';
import {
  ISubmissionModel,
  loadSubmissionClass,
} from '@/form/db/models/Submission';
import { IInvoiceDocument } from '@/invoice/@types/invoice';
import { IInvoiceModel, loadInvoiceClass } from '@/invoice/db/models/Invoice';
import { IProjectMemberDocument } from '@/project/@types/member';
import { IProjectPaymentPlan } from '@/project/@types/payment';
import { IProjectDocument } from '@/project/@types/project';
import {
  IProjectMemberModel,
  loadProjectMemberClass,
} from '@/project/db/models/Member';
import {
  IProjectPaymentPlanModel,
  loadProjectPaymentPlanClass,
} from '@/project/db/models/Payment';
import { IProjectModel, loadProjectClass } from '@/project/db/models/Project';
import { IUnitDocument } from '@/unit/@types/unit';
import { IUnitLeadDocument } from '@/unit/@types/unitLead';
import { IUnitModel, loadUnitClass } from '@/unit/db/models/Unit';
import { IUnitLeadModel, loadUnitLeadClass } from '@/unit/db/models/UnitLead';
import { IMainContext } from 'erxes-api-shared/core-types';
import { createGenerateModels } from 'erxes-api-shared/utils';

import mongoose from 'mongoose';
import { IUnitTypeDocument } from './modules/unit/@types/unitType';
import {
  IUnitTypeModel,
  loadUnitTypeClass,
} from './modules/unit/db/models/UnitType';
import {
  ISupplierModels,
  loadSupplierModels,
} from '@/supplier/db/loadModels';
import {
  IMembershipModels,
  loadMembershipModels,
} from '@/membership/db/loadModels';

export interface IModels extends ISupplierModels, IMembershipModels {
  Agency: IBlockAgencyModel;
  Listing: IBlockAdminListingModel;
  Project: IProjectModel;
  ProjectPaymentPlan: IProjectPaymentPlanModel;
  Building: IBuildingModel;
  Zoning: IZoningModel;
  Unit: IUnitModel;
  UnitType: IUnitTypeModel;
  UnitLead: IUnitLeadModel;
  BlockDocument: IBlockDocumentModel;
  BlockAttachment: IBlockAttachmentModel;
  Developer: IBlockDeveloperModel;
  Contract: IContractModel;
  ContractPayment: IContractPaymentModel;
  BlockCustomer: IBlockCustomerModel;
  ProjectMember: IProjectMemberModel;
  Offer: IOfferModel;
  Invoice: IInvoiceModel;
  Submission: ISubmissionModel;
}

export interface IContext extends IMainContext {
  models: IModels;
  subdomain: string;
}

export const loadClasses = (db: mongoose.Connection): IModels => {
  const models = {} as IModels;

  models.Agency = db.model<IBlockAgencyDocument, IBlockAgencyModel>(
    'block_admin_agencies',
    loadBlockAgencyClass(models),
  );

  models.Listing = db.model<
    IBlockAdminListingDocument,
    IBlockAdminListingModel
  >('block_admin_listings', loadBlockAdminListingClass(models));

  models.Project = db.model<IProjectDocument, IProjectModel>(
    'block_admin_projects',
    loadProjectClass(models),
  );

  models.ProjectPaymentPlan = db.model<
    IProjectPaymentPlan,
    IProjectPaymentPlanModel
  >('block_admin_project_payment_plans', loadProjectPaymentPlanClass(models));

  models.Building = db.model<IBuildingDocument, IBuildingModel>(
    'block_admin_buildings',
    loadBuildingClass(models),
  );

  models.Zoning = db.model<IZoningDocument, IZoningModel>(
    'block_admin_zonings',
    loadZoningClass(models),
  );

  models.Unit = db.model<IUnitDocument, IUnitModel>(
    'block_admin_units',
    loadUnitClass(models),
  );

  models.UnitType = db.model<IUnitTypeDocument, IUnitTypeModel>(
    'block_admin_unit_types',
    loadUnitTypeClass(models),
  );

  models.BlockDocument = db.model<IBlockDocumentDocument, IBlockDocumentModel>(
    'block_admin_documents',
    loadBlockDocumentClass(models),
  );

  models.BlockAttachment = db.model<
    IBlockAttachmentDocument,
    IBlockAttachmentModel
  >('block_admin_attachments', loadBlockAttachmentClass(models));

  models.Developer = db.model<IBlockDeveloperDocument, IBlockDeveloperModel>(
    'block_admin_developers',
    loadBlockDeveloperClass(models),
  );

  models.Contract = db.model<IContractDocument, IContractModel>(
    'block_admin_contracts',
    loadContractClass(models),
  );

  models.ContractPayment = db.model<
    IContractPaymentDocument,
    IContractPaymentModel
  >('block_admin_contract_payments', loadContractPaymentClass(models));

  models.BlockCustomer = db.model<
    IBlockCustomerDocument,
    IBlockCustomerModel
  >('block_admin_customers', loadBlockCustomerClass(models));

  models.ProjectMember = db.model<IProjectMemberDocument, IProjectMemberModel>(
    'block_admin_project_members',
    loadProjectMemberClass(models),
  );

  models.UnitLead = db.model<IUnitLeadDocument, IUnitLeadModel>(
    'block_admin_unit_leads',
    loadUnitLeadClass(models),
  );

  models.Offer = db.model<IOfferDocument, IOfferModel>(
    'block_admin_offers',
    loadOfferClass(models),
  );

  models.Invoice = db.model<IInvoiceDocument, IInvoiceModel>(
    'block_admin_invoices',
    loadInvoiceClass(models),
  );

  models.Submission = db.model<ISubmissionDocument, ISubmissionModel>(
    'block_admin_submissions',
    loadSubmissionClass(models),
  );

  loadSupplierModels(models, db);

  loadMembershipModels(models, db);

  return models;
};

export const generateModels = createGenerateModels<IModels>(loadClasses);
