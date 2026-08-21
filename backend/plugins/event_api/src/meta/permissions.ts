import { IPermissionConfig } from 'erxes-api-shared/core-types';

export const permissions: IPermissionConfig = {
  plugin: 'event',
  modules: [
    {
      name: 'event',
      description: 'Event management',
      scopeField: null,
      ownerFields: ['ownerId'],
      scopes: [
        { name: 'own', description: 'Records assigned to the current user' },
        {
          name: 'group',
          description: 'Records available to the current user groups',
        },
        { name: 'all', description: 'All records' },
      ],
      actions: [
        {
          title: 'View events',
          name: 'showEvents',
          description: 'View events and their agenda',
          always: true,
        },
        {
          title: 'Manage events',
          name: 'manageEvents',
          description: 'Create, update and remove events',
        },
      ],
    },
    {
      name: 'invitation',
      description: 'Event attendance',
      scopeField: null,
      ownerFields: [],
      scopes: [
        {
          name: 'group',
          description: 'Records available to the current user groups',
        },
        { name: 'all', description: 'All records' },
      ],
      actions: [
        {
          title: 'View attendance',
          name: 'showEventAttendance',
          description: 'View invitations and attendance summaries',
          always: true,
        },
      ],
    },
  ],
  defaultGroups: [
    {
      id: 'event:admin',
      name: 'Event Admin',
      description: 'Full access to the Event plugin',
      permissions: [
        {
          plugin: 'event',
          module: 'event',
          actions: ['showEvents', 'manageEvents'],
          scope: 'all',
        },
        {
          plugin: 'event',
          module: 'invitation',
          actions: ['showEventAttendance'],
          scope: 'all',
        },
      ],
    },
    {
      id: 'event:organizer',
      name: 'Event Organizer',
      description: 'Creates and runs events for their group',
      permissions: [
        {
          plugin: 'event',
          module: 'event',
          actions: ['showEvents', 'manageEvents'],
          scope: 'group',
        },
        {
          plugin: 'event',
          module: 'invitation',
          actions: ['showEventAttendance'],
          scope: 'group',
        },
      ],
    },
    {
      id: 'event:viewer',
      name: 'Event Viewer',
      description: 'Read-only access to events and attendance',
      permissions: [
        {
          plugin: 'event',
          module: 'event',
          actions: ['showEvents'],
          scope: 'group',
        },
        {
          plugin: 'event',
          module: 'invitation',
          actions: ['showEventAttendance'],
          scope: 'group',
        },
      ],
    },
  ],
};
