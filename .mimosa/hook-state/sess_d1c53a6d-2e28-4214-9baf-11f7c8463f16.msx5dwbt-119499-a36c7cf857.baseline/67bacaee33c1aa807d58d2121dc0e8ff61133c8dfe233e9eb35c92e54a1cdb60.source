import { Spinner, useQueryState } from 'erxes-ui';
import { lazy, Suspense } from 'react';
import { AGENCY_TABS } from '../constants/sidebar';

const AgencyProfileIdentity = lazy(() =>
  import('./AgencyProfileIdentity').then((m) => ({
    default: m.AgencyProfileIdentity,
  })),
);
const AgencyProfileGeneral = lazy(() =>
  import('./AgencyProfileGeneral').then((m) => ({
    default: m.AgencyProfileGeneral,
  })),
);
const AgencyProfileIntroduction = lazy(() =>
  import('./AgencyProfileIntroduction').then((m) => ({
    default: m.AgencyProfileIntroduction,
  })),
);
const AgencyProfileFieldsOfExpertise = lazy(() =>
  import('./AgencyProfileFieldsOfExpertise').then((m) => ({
    default: m.AgencyProfileFieldsOfExpertise,
  })),
);
const AgencyProfileOperationArea = lazy(() =>
  import('./AgencyProfileOperationArea').then((m) => ({
    default: m.AgencyProfileOperationArea,
  })),
);
const AgencyProfileContact = lazy(() =>
  import('./AgencyProfileContact').then((m) => ({
    default: m.AgencyProfileContact,
  })),
);
const AgencyProfileSocialLinks = lazy(() =>
  import('./AgencyProfileSocialLinks').then((m) => ({
    default: m.AgencyProfileSocialLinks,
  })),
);
const AgencyProfileDocuments = lazy(() =>
  import('./AgencyProfileDocuments').then((m) => ({
    default: m.AgencyProfileDocuments,
  })),
);

const AgencyMembers = lazy(() =>
  import('./AgencyMembers').then((m) => ({
    default: m.AgencyMembers,
  })),
);

const AgencyProfileIntegrations = lazy(() =>
  import('./AgencyProfileIntegrations').then((m) => ({
    default: m.AgencyProfileIntegrations,
  })),
);

export const AgencyProfileTabs = () => {
  const [activeTab] = useQueryState('activeTab', {
    defaultValue: 'general',
  });

  return (
    <Suspense fallback={<Spinner containerClassName="py-32" />}>
      {activeTab === AGENCY_TABS.GENERAL && <AgencyProfileGeneral />}
      {activeTab === AGENCY_TABS.IDENTITY && <AgencyProfileIdentity />}
      {activeTab === AGENCY_TABS.INTRODUCTION && <AgencyProfileIntroduction />}
      {activeTab === AGENCY_TABS.DOCUMENTS && <AgencyProfileDocuments />}
      {activeTab === AGENCY_TABS.FIELD_OF_ACTIVITY && (
        <AgencyProfileFieldsOfExpertise />
      )}
      {activeTab === AGENCY_TABS.OPERATION_AREA && (
        <AgencyProfileOperationArea />
      )}
      {activeTab === AGENCY_TABS.CONTACT && <AgencyProfileContact />}
      {activeTab === AGENCY_TABS.SOCIAL_LINKS && <AgencyProfileSocialLinks />}
      {/* Settings */}
      {activeTab === AGENCY_TABS.MEMBERS && <AgencyMembers />}
      {activeTab === AGENCY_TABS.INTEGRATIONS && <AgencyProfileIntegrations />}
    </Suspense>
  );
};
