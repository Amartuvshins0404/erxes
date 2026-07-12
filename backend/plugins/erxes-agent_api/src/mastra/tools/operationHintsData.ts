/**
 * Static operation-hints seed — argument constraints enforced in erxes
 * resolver/model code but ABSENT from the GraphQL schema, so the schema
 * introspection phase2 relies on can't surface them.
 *
 * Advisory only: these facts enter an operation's search signature so the model
 * knows a rule before calling; the server remains the sole enforcer. Nothing
 * here fails an operation.
 *
 * GENERATED from a static census of the whole backend regenerated 2026-07-06,
 * including a deterministic top-up pass (290 uncovered throw sites verified):
 * per-plugin agents diff each resolver/model constraint against its `.graphql`
 * schema (klass op-specific + convention only), merged with hand-verified
 * production-proven facts. To regenerate: re-run that census and re-derive this
 * map — it is version controlled, not learned at runtime. Keep each string
 * tight: it ships in model context with every matching search result.
 *
 *   required:     args the server requires even though the schema marks them nullable
 *   enums:        arg → closed, known token set the server enforces (schema is String)
 *   rules:        one-line cross-field / conditional / format constraints
 *   patternRules: rules expressed via HINT_PATTERNS instead of a duplicated string
 *
 * Arg keys use the signature path the model sees: a top-level arg name, or
 * `input.field` for a one-level INPUT_OBJECT field.
 *
 * 2026-07-07: rule sentences repeated verbatim (arg name aside) on 3+
 * operations were promoted to HINT_PATTERNS and referenced via patternRules;
 * operationHints.ts expands them back to the exact original strings.
 */

export interface OperationHint {
  required?: string[];
  enums?: Record<string, string[]>;
  rules?: string[];
  patternRules?: Array<{ p: string; arg: string }>;
}

export const HINT_PATTERNS: Record<string, string> = {
  nonEmpty: '{arg} must be non-empty',
  atLeastOneOf: 'provide at least one of {args}',
  registryIdentifier:
    '{arg} must be a registry/ClawHub/pinned-package identifier with no shell, path or url metacharacters',
  nameEnMnBothRequired: 'name.en and name.mn must both be non-empty',
};

export const OPERATION_HINTS: Record<string, OperationHint> = {
  // core-api — products (production-proven facts the census missed)
  productsAdd: {
    required: ['uom'],
    rules: ["duration must be greater than 0 when product type is 'unique'"],
  },
  productsEdit: {
    rules: ['uom is required when code is provided'],
  },
  productBulkSimilarityAdd: {
    rules: [
      'code is required',
      'at least one product is required',
      'every included product row must have a code',
    ],
  },
  productBulkSimilarityEdit: {
    rules: ['code is required', 'at least one product is required'],
  },
  engageMessageAdd: {
    rules: ['targetIds must be a non-empty list of recipient ids'],
  },
  cpUsersAdd: {
    patternRules: [{ p: 'atLeastOneOf', arg: 'email or phone' }],
  },
  customersAdd: {
    rules: [
      'custom fields marked required must have non-empty values; email/number/date-validated custom fields must match their format',
    ],
  },
  customers: {
    rules: ['dateFilters must be a valid JSON-encoded object of {field:{gte,lte}}'],
  },
  usersSetActiveStatus: {
    rules: ['_id cannot be your own user id'],
  },
  usersSetActiveStatusBatch: {
    rules: ['_ids cannot include your own user id'],
  },
  usersCreateOwner: {
    rules: ['password must not be an empty string'],
  },
  usersChangePassword: {
    rules: ['newPassword must not be an empty string'],
  },
  clientPortalUserRegister: {
    rules: [
      'email must be a valid address (max 254 chars)',
      'provide at least one of email or phone when registering with a password',
    ],
  },
  templateCategories: {
    rules: ['dateFilters must be a valid JSON string'],
  },

  // insurance_api
  updateContractPaymentStatus: {
    enums: { paymentStatus: ['pending', 'paid', 'cancelled', 'refunded'] },
  },
  updateContract: {
    enums: { paymentStatus: ['pending', 'paid', 'cancelled', 'refunded'] },
  },
  createVendorUser: {
    enums: { role: ['user', 'admin', 'manager'] },
  },
  updateVendorUser: {
    enums: { role: ['user', 'admin', 'manager'] },
  },

  // blocktest_api
  cvCreateClient: {
    required: ['input.client_type', 'input.status'],
  },
  cvCreateRiskGroup: {
    required: [
      'input.name',
      'input.client',
      'input.effective_date',
      'input.expiration_date',
    ],
  },

  // btkadmin_api
  btkAdminSubmitForm: {
    required: ['input.email'],
  },

  // car_api
  cpCarsAdd: {
    patternRules: [{ p: 'atLeastOneOf', arg: 'plateNumber or vinNumber' }],
  },
  carsMerge: {
    rules: ['carIds must contain at least two ids'],
  },
  carsAdd: {
    enums: {
      bodyType: [
        '',
        'Sedan',
        'SUV',
        'Compact',
        'Wagon',
        'Coupe',
        'Van',
        'Hatchback',
        'Pickup',
        'SportCoupe',
      ],
      fuelType: ['', 'Hybrid', 'Petrol', 'Diesel', 'FlexiFuel', 'Electric'],
      gearBox: ['', 'Automatic', 'Manual', 'CVT', 'SemiAutomatic'],
      status: ['Active', 'Deleted'],
    },
  },

  // accounting_api
  reserveRemsAdd: {
    patternRules: [
      { p: 'atLeastOneOf', arg: 'productCategoryId or productId' },
    ],
  },
  reCalcRemainders: {
    patternRules: [
      {
        p: 'atLeastOneOf',
        arg: 'departmentId, branchId, productCategoryId or productIds',
      },
    ],
  },
  accounts: {
    enums: { permissionMode: ['read', 'write'] },
  },
  setAccountPermissions: {
    rules: [
      'read must be a valid permission scope (ACCOUNT_PERMISSION_SCOPES)',
      'write must be a valid write scope (ACCOUNT_PERMISSION_WRITE_SCOPES)',
    ],
  },
  accountCategoriesAdd: {
    rules: ["code may not contain the '/' character"],
  },

  // agent_api
  deployManagedAgent: {
    enums: { 'input.provider': ['kimi'] },
  },
  agentDiscordUpdateBinding: {
    enums: { 'input.responseMode': ['slash_only', 'all_messages'] },
  },
  createIdentifier: {
    enums: { 'input.kind': ['assistant', 'agent'] },
  },
  agentRuntimeInstallSkill: {
    patternRules: [{ p: 'registryIdentifier', arg: 'slug' }],
    rules: ['version, when provided, must match the safe version format'],
  },
  agentRuntimeEnablePlugin: {
    patternRules: [{ p: 'registryIdentifier', arg: 'pluginId' }],
  },
  agentRuntimeDisablePlugin: {
    patternRules: [{ p: 'registryIdentifier', arg: 'pluginId' }],
  },
  agentRuntimePluginInspect: {
    patternRules: [{ p: 'registryIdentifier', arg: 'pluginId' }],
  },
  agentRuntimeSkillSearch: {
    rules: ['query must contain no url, path or shell metacharacters'],
  },
  agentRuntimePluginSearch: {
    rules: ['query must contain no url, path or shell metacharacters'],
  },
  agentRuntimeInstallPlugin: {
    rules: [
      'plugin must be a clawhub:<id> or pinned npm identifier; an unpinned plugin also needs a version arg, and an inline pin and a version arg cannot both be set',
    ],
  },
  setOpencodeApiKey: {
    rules: [
      'input.apiKey must be non-empty after trimming',
      'input.provider is required when the server has no provider recorded (falls back to the stored one)',
    ],
  },

  // frontline_api
  conversationMessageAdd: {
    rules: [
      'content is required unless contentType is VIDEO_CALL or at least one attachment is supplied',
    ],
  },
  knowledgeBaseArticlesAdd: {
    rules: [
      "scheduledDate is required and must not be in the past when status is 'scheduled'",
    ],
  },
  knowledgeBaseArticlesEdit: {
    rules: [
      "scheduledDate is required and must not be in the past when status is 'scheduled'",
    ],
  },
  conversationSetAutomatedReplyControl: {
    enums: {
      status: ['active', 'handoff_requested', 'human_active'],
      reason: [
        'customer_requested',
        'operator_reply',
        'manual',
        'timeout_expired',
      ],
    },
  },
  conversationsResolve: {
    rules: ['ids must be a non-empty list'],
  },
  callsIntegrationUpdate: {
    required: ['configs.inboxId'],
  },
  callAddCustomer: {
    required: ['primaryPhone'],
  },
  callHistoryDetail: {
    patternRules: [{ p: 'atLeastOneOf', arg: '_id or conversationId' }],
  },
  formsAdd: {
    rules: ["when type is 'lead', leadData, if provided, must be a non-empty object"],
  },

  // core-api — products (packages / templates / contacts / structure)
  productPackagesAdd: {
    required: ['name', 'products'],
    rules: ['price must be a non-negative number (>= 0)'],
  },
  productPackagesEdit: {
    rules: [
      'percent must be between 0 and 100',
      'name cannot be empty when provided',
      'price, when provided, must be a non-negative number',
      'products, when provided, must contain at least one product with a productId',
    ],
  },
  productPackagesChangeStatus: {
    rules: ['status must be a valid package status (PACKAGE_STATUSES)'],
  },
  templateAdd: {
    required: ['contentId', 'contentType'],
    rules: ["contentType must be formatted 'pluginName:moduleName[:collection]'"],
  },
  templateCategoryAdd: {
    rules: ["code may not contain the '/' character"],
  },
  customersChangeStateBulk: {
    patternRules: [{ p: 'nonEmpty', arg: '_ids' }],
    rules: ['value must be a valid lifecycle state (COC_LIFECYCLE_STATE_TYPES)'],
  },
  unitsRemove: { patternRules: [{ p: 'nonEmpty', arg: 'ids' }] },
  branchesRemove: { patternRules: [{ p: 'nonEmpty', arg: 'ids' }] },
  positionsRemove: { patternRules: [{ p: 'nonEmpty', arg: 'ids' }] },
  departmentsRemove: { patternRules: [{ p: 'nonEmpty', arg: 'ids' }] },

  // block_api
  createBlockOpptyStatus: {
    rules: [
      'type is required and must be a valid status type, excluding the terminal CLOSED_WON / CLOSED_LOST',
    ],
  },
  updateBlockOpptyStatus: {
    rules: [
      'type is required and must be a valid status type, excluding the terminal CLOSED_WON / CLOSED_LOST',
    ],
  },
  createBlockContractStatus: {
    rules: [
      'type is required and must be a valid contract status type, excluding the terminal contract status types',
    ],
  },
  updateBlockContractStatus: {
    rules: [
      'type is required and must be a valid contract status type, excluding the terminal contract status types',
    ],
  },
  blockCreateUnits: {
    rules: ['zoneRange start must be <= end (zoneRange[0] <= zoneRange[1])'],
  },
  blockCreateOppty: {
    required: ['input.description', 'input.customerId', 'input.status'],
  },
  blockCreateBuilding: {
    required: ['input.name', 'input.types', 'input.project'],
  },

  // blockadmin_api
  blockAdminSubmitForm: {
    required: ['input.form'],
  },

  // payment_api
  generateInvoiceUrl: {
    required: ['input.paymentIds'],
    patternRules: [{ p: 'nonEmpty', arg: 'paymentIds' }],
  },
  cpGenerateInvoiceUrl: {
    required: ['input.paymentIds'],
    patternRules: [{ p: 'nonEmpty', arg: 'paymentIds' }],
  },
  invoiceCreate: {
    rules: ['amount must be non-zero'],
  },
  paymentTransactionsAdd: {
    rules: ['amount must be non-zero'],
  },
  paymentAdd: {
    rules: ['kind must be a supported payment kind (PAYMENTS)'],
  },

  // mto_api (events / registration / association)
  mtoEventCreate: {
    rules: [
      'provide at least one categoryId',
      'endDate must be on or after startDate',
    ],
  },
  mtoEventUpdate: {
    rules: [
      'the effective categoryIds must be non-empty',
      'endDate must be on or after startDate',
    ],
  },
  mtoRegistrationApplicationUpdate: {
    enums: {
      status: ['draft', 'submitted', 'under_review', 'approved', 'rejected'],
    },
  },
  cpMtoRegistrationApplicationUpdate: {
    enums: {
      status: ['draft', 'submitted', 'under_review', 'approved', 'rejected'],
    },
  },
  mtoAssociationUpdate: {
    rules: ["parentId must not equal the record's own _id"],
  },
  mtoRegistrationFormSchemaCreate: {
    rules: [
      'definition must be an object with non-empty membershipTypeId, schemaVersion and title, and a non-empty sections array',
    ],
  },
  mtoRegistrationFormSchemaUpdate: {
    rules: [
      'definition must be an object with non-empty membershipTypeId, schemaVersion and title, and a non-empty sections array',
    ],
  },

  // mongolian_api (ebarimt / configs)
  putResponsesByDate: {
    rules: [
      "provide createdStartDate and createdEndDate together, or paidDate='today'",
      'the date range may not exceed ~32 days',
    ],
  },
  putResponsesDuplicated: {
    rules: [
      'startDate and endDate are required together',
      'the date range may not exceed ~32 days',
    ],
  },
  ebarimtProductRuleCreate: {
    enums: { kind: ['vat', 'ctax'] },
    rules: [
      "when kind is 'vat', taxType, taxCode and taxPercent are all required",
    ],
  },
  ebarimtProductGroupCreate: {
    rules: ['mainProductId must not equal subProductId'],
  },
  mnConfigsCreate: {
    enums: {
      code: [
        'EBARIMT',
        'stageInEbarimt',
        'posInEbarimt',
        'returnStageInEbarimt',
        'dealsProductsDataPrint',
        'dealsProductsDataSplit',
        'dealsProductsDataPlaces',
        'dealsProductsDefaultFilter',
        'dealsSplitConfig',
        'dealsPrintConfig',
        'DYNAMIC',
        'ERKHET',
        'ebarimtConfig',
        'returnEbarimtConfig',
        'posOrderErkhetConfig',
        'stageInMoveConfig',
        'stageInIncomeConfig',
        'remainderConfig',
      ],
    },
  },

  // content_api (cms / webbuilder)
  cmsMostViewedPosts: {
    rules: ['days must be a positive integer (> 0)'],
  },
  cpMostViewedPosts: {
    rules: ['days must be a positive integer (> 0)'],
  },
  cmsPost: {
    rules: ['clientPortalId is required when querying by count or slug'],
  },
  cpPost: {
    rules: ['clientPortalId is required when querying by count or slug'],
  },
  cmsMenuList: { required: ['clientPortalId'] },
  cmsPages: { required: ['clientPortalId'] },
  cmsPageList: { required: ['clientPortalId'] },
  cpCmsAddTranslation: {
    enums: { 'input.type': ['post', 'page', 'category', 'tag', 'menu'] },
    rules: ['provide input.objectId (or input.postId as a fallback)'],
  },
  cpWebPagesAdd: {
    required: ['input.webId'],
  },
  cpWebPage: {
    rules: ['webId is required when querying by slug'],
  },
  cmsCustomPostTypesAdd: {
    rules: ['code must match ^[a-zA-Z0-9_]+$ (letters, digits and underscore)'],
  },
  cmsPostsEdit: {
    rules: ['slug, when provided, must be non-empty'],
  },
  cmsPosts: {
    rules: ['clientPortalId is required when a language filter is supplied'],
  },
  editWeb: {
    rules: ['clientPortalId cannot be changed after creation'],
  },
  cpEditWeb: {
    rules: ['clientPortalId cannot be changed after creation'],
  },

  // mushop_api
  mushopUpdateProductStatus: {
    enums: { status: ['pending', 'approved', 'rejected'] },
  },
  mushopSyncProductsToPosclient: {
    rules: ["status, when provided, must equal 'approved'"],
  },
  mushopUpdateSupplierVerificationStatus: {
    rules: [
      'verificationStatus must be a valid verification status (SUPPLIER_VERIFICATION_STATUS)',
    ],
  },
  mushopUpdateSupplierTier: {
    rules: ['tierLevel must be a non-negative integer (>= 0)'],
  },
  mushopUpdateMembershipStatus: {
    rules: ['status must be a valid membership status (MEMBERSHIP_STATUS)'],
  },
  mushopSuppliers: {
    rules: ['dateFilters must be valid JSON'],
  },
  mushopProductSpecificationSave: {
    patternRules: [{ p: 'atLeastOneOf', arg: 'productId or code' }],
  },

  // supplier_api
  supplierUpdateVerificationStatus: {
    enums: { status: ['verified', 'unverified', 'pending'] },
  },
  supplierUpdateTierLevel: {
    rules: ['tierLevel must be a non-negative integer (>= 0)'],
  },
  collectivePackageAdd: {
    required: ['input.name', 'input.productIds'],
    rules: ['name must be non-empty after trimming whitespace'],
  },
  collectivePackageEditStatus: {
    rules: ['status must be non-empty after trimming whitespace'],
  },

  // operation_api (cycle / task / status)
  createCycle: {
    required: ['startDate', 'endDate'],
    rules: ['startDate must be on or before endDate'],
  },
  createTask: {
    rules: [
      "status is required unless triageId is set (then the team's backlog status is filled in)",
    ],
  },
  addStatus: {
    required: ['color', 'type'],
  },

  // loyalty_api (campaigns)
  spinCampaignsAdd: {
    rules: ['the sum of awards[].probability must be between 0 and 100'],
  },
  donateCampaignsAdd: {
    rules: [
      'maxScore must be >= the highest award minScore',
      'award minScore values must be unique',
    ],
  },
  voucherCampaignsAdd: {
    required: ['title', 'startDate', 'endDate'],
    rules: [
      'bonusCount is required when bonusProductId is set; spinCount when spinCampaignId is set; lotteryCount when lotteryCampaignId is set',
      'when finishDateOfUse is also set: startDate must be in the future (within ~24h), endDate >= startDate, and finishDateOfUse >= endDate',
    ],
  },
  couponCampaignAdd: {
    rules: [
      "codeRule.charSet must be an array, and codeRule.pattern may only use characters from charSet plus '#' and '-'",
    ],
  },
  scoreCampaignAdd: {
    rules: [
      "fieldId is required when fieldGroupId is set and fieldOrigin is 'exists'",
      "fieldName is required when fieldGroupId is set and fieldOrigin is 'new'",
    ],
  },
  buySpin: {
    required: ['ownerId', 'ownerType'],
  },
  buyVoucher: {
    required: ['ownerId', 'ownerType'],
  },

  // pos (posclient)
  coverAmounts: {
    rules: ['endDate must not be in the future'],
  },
  ordersChange: {
    rules: ['dueDate, when supplied, must be in the future'],
  },
  ordersAdd: {
    rules: [
      'items must contain at least one non-package product',
      'for pre-orders, dueDate must be in the future',
    ],
  },
  posUsersCreateOwner: {
    patternRules: [{ p: 'nonEmpty', arg: 'password' }],
  },

  // onefit_api
  cpOneFitProviderReviewAdd: {
    rules: ['rating must be a number between 1 and 5'],
  },
  cpOneFitProviderReviewUpdate: {
    rules: ['rating, when provided, must be a number between 1 and 5'],
  },
  oneFitMembershipHoldStart: {
    rules: ['holdDays must be greater than 0'],
  },
  oneFitPromoCodeUpdate: {
    rules: ['code, when provided, must be non-empty after trimming'],
  },
  oneFitProviders: {
    rules: ['limit must be between 1 and 100'],
  },
  oneFitCityCreate: {
    patternRules: [{ p: 'nameEnMnBothRequired', arg: '' }],
  },
  oneFitCityUpdate: {
    patternRules: [{ p: 'nameEnMnBothRequired', arg: '' }],
  },
  oneFitDistrictCreate: {
    patternRules: [{ p: 'nameEnMnBothRequired', arg: '' }],
  },
  oneFitDistrictUpdate: {
    patternRules: [{ p: 'nameEnMnBothRequired', arg: '' }],
  },
  oneFitMembershipPlanCreate: {
    rules: [
      'each saleOptions[].quantity must be an integer >= 2',
      'saleOptions[].discountPercent, when present, must be between 0 and 100',
      'each saleOption must define exactly one of discountPercent or finalPrice',
      "for non-credit plans (planType != 'credit'), duration is required and must be greater than 0",
    ],
  },

  // tourism_api (bms)
  bmsCustomTourTypesAdd: {
    rules: ['code must match ^[a-zA-Z0-9_]+$ (letters, digits and underscore)'],
  },
  bmsTourAdd: {
    rules: [
      "branchId is required when customTourTypeId is set and is not 'tour'",
      'each pricingOptions[].minPersons must be >= 1',
      'pricingOptions[].maxPersons, when provided, must be >= minPersons',
      'each pricingOptions[] adult price must be defined and greater than 0',
    ],
  },
  bmsTourEdit: {
    rules: [
      "startDate is required when dateType is 'fixed'",
      "when dateType is 'flexible', availableFrom and availableTo are required and availableFrom must be before availableTo",
    ],
  },

  // sales_api
  salesPipelinesAdd: {
    enums: {
      visibility: ['public', 'private'],
      hackScoringType: ['rice', 'ice', 'pie'],
    },
    rules: [
      'if either numberConfig or numberSize is set, both are required, and numberConfig must not end with a digit',
    ],
  },
  salesPipelinesEdit: {
    rules: [
      'if either numberConfig or numberSize is set, both are required, and numberConfig must not end with a digit',
    ],
  },

  // ecommerce
  addressAdd: {
    rules: [
      'when coordinate is provided, both coordinate.lat and coordinate.lng are required',
    ],
  },
};
