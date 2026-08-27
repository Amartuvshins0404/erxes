import { IPermissionConfig } from 'erxes-api-shared/core-types';

export const permissions: IPermissionConfig = {
  plugin: 'oroltsoo',

  modules: [
    {
      name: 'oroltsooProfile',
      description: 'Улс төрчийн профайл',
      scopeField: null,
      ownerFields: [],
      scopes: [{ name: 'all', description: 'Бүх профайл' }],
      actions: [
        {
          title: 'Профайл харах',
          name: 'showOroltsooProfiles',
          description: 'Улс төрчийн профайл жагсаалт болон дэлгэрэнгүйг харах',
        },
        {
          title: 'Профайл удирдах',
          name: 'manageOroltsooProfiles',
          description: 'Улс төрчийн профайл үүсгэх, засах, устгах',
        },
      ],
    },
    {
      name: 'oroltsooMeeting',
      description: 'Вэб сайтаас ирсэн уулзалтын хуваарь (зөвхөн харах)',
      scopeField: null,
      ownerFields: [],
      scopes: [{ name: 'all', description: 'Бүх уулзалт' }],
      actions: [
        {
          title: 'Уулзалт харах',
          name: 'showOroltsooMeetings',
          description: 'Вэб сайтаас ирсэн уулзалтын хуваарийг харах',
        },
      ],
    },
    {
      name: 'oroltsooPost',
      description: 'Улс төрчийн нийтлэл, мэдээ',
      scopeField: null,
      ownerFields: [],
      scopes: [{ name: 'all', description: 'Бүх пост' }],
      actions: [
        {
          title: 'Пост харах',
          name: 'showOroltsooPosts',
          description: 'Постын жагсаалт болон дэлгэрэнгүйг харах',
        },
        {
          title: 'Пост удирдах',
          name: 'manageOroltsooPosts',
          description: 'Пост үүсгэх, засах, устгах',
        },
      ],
    },
  ],

  defaultGroups: [
    {
      id: 'oroltsoo:admin',
      name: 'Улс төрчийн профайл — удирдах',
      description: 'Профайл харах, үүсгэх, засах, устгах бүрэн эрх',
      permissions: [
        {
          plugin: 'oroltsoo',
          module: 'oroltsooProfile',
          actions: ['showOroltsooProfiles', 'manageOroltsooProfiles'],
          scope: 'all',
        },
        {
          plugin: 'oroltsoo',
          module: 'oroltsooMeeting',
          actions: ['showOroltsooMeetings'],
          scope: 'all',
        },
        {
          plugin: 'oroltsoo',
          module: 'oroltsooPost',
          actions: ['showOroltsooPosts', 'manageOroltsooPosts'],
          scope: 'all',
        },
      ],
    },
    {
      id: 'oroltsoo:viewer',
      name: 'Улс төрчийн профайл — үзэх',
      description: 'Зөвхөн профайл харах эрх',
      permissions: [
        {
          plugin: 'oroltsoo',
          module: 'oroltsooProfile',
          actions: ['showOroltsooProfiles'],
          scope: 'all',
        },
        {
          plugin: 'oroltsoo',
          module: 'oroltsooMeeting',
          actions: ['showOroltsooMeetings'],
          scope: 'all',
        },
        {
          plugin: 'oroltsoo',
          module: 'oroltsooPost',
          actions: ['showOroltsooPosts'],
          scope: 'all',
        },
      ],
    },
  ],
};
