import { IPermissionConfig } from 'erxes-api-shared/core-types';

export const permissions: IPermissionConfig = {
  plugin: 'mushop',

  modules: [
    {
      name: 'membership',
      description: 'Mushop memberships',
      scopeField: null,
      ownerFields: [],
      scopes: [{ name: 'all', description: 'All memberships' }],
      actions: [
        {
          title: 'View memberships',
          name: 'showMushopMemberships',
          description: 'List and view membership records',
          always: true,
        },
        {
          title: 'Cancel membership',
          name: 'mushopCancelMembership',
          description: 'Cancel any customer membership',
        },
        {
          title: 'Grant membership',
          name: 'mushopGrantMembership',
          description: 'Manually grant or extend a membership for a customer',
        },
        {
          title: 'Adjust membership end date',
          name: 'mushopUpdateMembershipEndDate',
          description:
            "Manually change a membership's end date (e.g. to revert an accidental grant)",
        },
        {
          title: 'Change membership status',
          name: 'mushopUpdateMembershipStatus',
          description:
            'Manually change a membership status (active / expired / cancelled)',
        },
      ],
    },
    {
      name: 'membershipPlan',
      description: 'Mushop membership plans',
      scopeField: null,
      ownerFields: [],
      scopes: [{ name: 'all', description: 'All plans' }],
      actions: [
        {
          title: 'View plans',
          name: 'showMushopMembershipPlans',
          description: 'List and view membership plans',
          always: true,
        },
        {
          title: 'Add plans',
          name: 'mushopMembershipPlanCreate',
          description: 'Create membership plans',
        },
        {
          title: 'Edit plans',
          name: 'mushopMembershipPlanUpdate',
          description: 'Edit membership plans',
        },
        {
          title: 'Deactivate plans',
          name: 'mushopMembershipPlanDeactivate',
          description: 'Deactivate membership plans',
        },
      ],
    },
    {
      name: 'supplier',
      description: 'Mushop suppliers',
      scopeField: null,
      ownerFields: [],
      scopes: [{ name: 'all', description: 'All suppliers' }],
      actions: [
        {
          title: 'View suppliers',
          name: 'showMushopSuppliers',
          description: 'List and view suppliers',
          always: true,
        },
        {
          title: 'Update verification status',
          name: 'mushopUpdateSupplierVerificationStatus',
          description: 'Approve or reject supplier verification',
        },
        {
          title: 'Update supplier tier',
          name: 'mushopUpdateSupplierTier',
          description: 'Change supplier tier level',
        },
        {
          title: 'Update supplier POS',
          name: 'mushopUpdateSupplierPos',
          description: 'Assign or change the POS configuration for a supplier',
        },
        {
          title: 'Update supplier Mushop POS',
          name: 'mushopUpdateSupplierMushopPos',
          description: 'Assign or change the Mushop POS configuration for a supplier',
        },
      ],
    },
    {
      name: 'product',
      description: 'Mushop products',
      scopeField: null,
      ownerFields: [],
      scopes: [{ name: 'all', description: 'All products' }],
      actions: [
        {
          title: 'View products',
          name: 'showMushopProducts',
          description: 'List and view products',
          always: true,
        },
        {
          title: 'Update product status',
          name: 'mushopUpdateProductStatus',
          description: 'Change product status (approve / reject / etc.)',
        },
        {
          title: 'Bulk update product status',
          name: 'mushopBulkUpdateProductStatus',
          description: 'Change status for many products at once',
        },
        {
          title: 'Assign product category',
          name: 'mushopAssignProductCategory',
          description: 'Move a product to a different category',
        },
        {
          title: 'Remove products',
          name: 'mushopRemoveProduct',
          description: 'Delete individual products',
        },
        {
          title: 'Bulk remove products',
          name: 'mushopBulkRemoveProducts',
          description: 'Delete many products at once',
        },
        {
          title: 'Save product specification',
          name: 'mushopProductSpecificationSave',
          description: 'Set product specification fields (e.g. MOQ)',
        },
      ],
    },
    {
      name: 'collective',
      description: 'Mushop collectives (co-shops)',
      scopeField: null,
      ownerFields: [],
      scopes: [{ name: 'all', description: 'All collectives' }],
      actions: [
        {
          title: 'View collectives',
          name: 'showMushopCollectives',
          description: 'List and view collectives',
          always: true,
        },
        {
          title: 'Create collective',
          name: 'mushopCreateCollective',
          description: 'Create a new collective',
        },
        {
          title: 'Update collective suppliers',
          name: 'mushopUpdateCollectiveSuppliers',
          description: 'Add or remove suppliers from a collective',
        },
        {
          title: 'Resync collective',
          name: 'mushopResyncCollective',
          description: 'Re-replicate collective products into the target SaaS',
        },
        {
          title: 'Remove collective',
          name: 'mushopRemoveCollective',
          description: 'Delete a collective',
        },
      ],
    },
    {
      name: 'config',
      description: 'Mushop settings',
      scopeField: null,
      ownerFields: [],
      scopes: [{ name: 'all', description: 'All settings' }],
      actions: [
        {
          title: 'View settings',
          name: 'showMushopConfig',
          description: 'View Mushop settings',
          always: true,
        },
        {
          title: 'Save settings',
          name: 'mushopConfigSave',
          description: 'Change Mushop settings (e.g. YEN to MNT rate)',
        },
      ],
    },
  ],

  defaultGroups: [
    {
      id: 'mushop:admin',
      name: 'Mushop Admin',
      description: 'Full access to Mushop plugin',
      permissions: [
        {
          plugin: 'mushop',
          module: 'membership',
          actions: [
            'showMushopMemberships',
            'mushopCancelMembership',
            'mushopGrantMembership',
            'mushopUpdateMembershipEndDate',
            'mushopUpdateMembershipStatus',
          ],
          scope: 'all',
        },
        {
          plugin: 'mushop',
          module: 'membershipPlan',
          actions: [
            'showMushopMembershipPlans',
            'mushopMembershipPlanCreate',
            'mushopMembershipPlanUpdate',
            'mushopMembershipPlanDeactivate',
          ],
          scope: 'all',
        },
        {
          plugin: 'mushop',
          module: 'supplier',
          actions: [
            'showMushopSuppliers',
            'mushopUpdateSupplierVerificationStatus',
            'mushopUpdateSupplierTier',
            'mushopUpdateSupplierPos',
            'mushopUpdateSupplierMushopPos',
          ],
          scope: 'all',
        },
        {
          plugin: 'mushop',
          module: 'product',
          actions: [
            'showMushopProducts',
            'mushopUpdateProductStatus',
            'mushopBulkUpdateProductStatus',
            'mushopAssignProductCategory',
            'mushopRemoveProduct',
            'mushopBulkRemoveProducts',
            'mushopProductSpecificationSave',
          ],
          scope: 'all',
        },
        {
          plugin: 'mushop',
          module: 'collective',
          actions: [
            'showMushopCollectives',
            'mushopUpdateCollectiveSuppliers',
            'mushopResyncCollective',
            'mushopRemoveCollective',
          ],
          scope: 'all',
        },
        {
          plugin: 'mushop',
          module: 'config',
          actions: ['showMushopConfig', 'mushopConfigSave'],
          scope: 'all',
        },
      ],
    },
    {
      id: 'mushop:operator',
      name: 'Mushop Operator',
      description:
        'Day-to-day moderation: approve products, verify suppliers, grant memberships',
      permissions: [
        {
          plugin: 'mushop',
          module: 'membership',
          actions: ['showMushopMemberships', 'mushopGrantMembership'],
          scope: 'all',
        },
        {
          plugin: 'mushop',
          module: 'membershipPlan',
          actions: ['showMushopMembershipPlans'],
          scope: 'all',
        },
        {
          plugin: 'mushop',
          module: 'supplier',
          actions: [
            'showMushopSuppliers',
            'mushopUpdateSupplierVerificationStatus',
          ],
          scope: 'all',
        },
        {
          plugin: 'mushop',
          module: 'product',
          actions: ['showMushopProducts', 'mushopUpdateProductStatus'],
          scope: 'all',
        },
        {
          plugin: 'mushop',
          module: 'collective',
          actions: ['showMushopCollectives'],
          scope: 'all',
        },
      ],
    },
    {
      id: 'mushop:viewer',
      name: 'Mushop Viewer',
      description: 'Read-only access to Mushop',
      permissions: [
        {
          plugin: 'mushop',
          module: 'membership',
          actions: ['showMushopMemberships'],
          scope: 'all',
        },
        {
          plugin: 'mushop',
          module: 'membershipPlan',
          actions: ['showMushopMembershipPlans'],
          scope: 'all',
        },
        {
          plugin: 'mushop',
          module: 'supplier',
          actions: ['showMushopSuppliers'],
          scope: 'all',
        },
        {
          plugin: 'mushop',
          module: 'product',
          actions: ['showMushopProducts'],
          scope: 'all',
        },
        {
          plugin: 'mushop',
          module: 'collective',
          actions: ['showMushopCollectives'],
          scope: 'all',
        },
      ],
    },
  ],
};
