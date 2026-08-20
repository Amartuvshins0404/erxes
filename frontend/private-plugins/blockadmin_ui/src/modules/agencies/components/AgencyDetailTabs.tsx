import { Spinner, useQueryState } from 'erxes-ui';
import { Suspense, lazy } from 'react';
import {
  AGENCY_DETAIL_TABS,
  AgencyDetailTab,
} from '../constants/agency-detail';

const AgencyDetailGeneral = lazy(() =>
  import('./AgencyDetailGeneral').then((module) => ({
    default: module.AgencyDetailGeneral,
  })),
);

const AgencyDetailActivity = lazy(() =>
  import('./AgencyDetailActivity').then((module) => ({
    default: module.AgencyDetailActivity,
  })),
);

const AgencyDetailOperationArea = lazy(() =>
  import('./AgencyDetailOperationArea').then((module) => ({
    default: module.AgencyDetailOperationArea,
  })),
);

const AgencyDetailContact = lazy(() =>
  import('./AgencyDetailContact').then((module) => ({
    default: module.AgencyDetailContact,
  })),
);

const AgencyDetailDocuments = lazy(() =>
  import('./AgencyDetailDocuments').then((module) => ({
    default: module.AgencyDetailDocuments,
  })),
);

const AgencyDetailSocialLinks = lazy(() =>
  import('./AgencyDetailSocialLinks').then((module) => ({
    default: module.AgencyDetailSocialLinks,
  })),
);

const AgencyDetailAgents = lazy(() =>
  import('./AgencyDetailAgents').then((module) => ({
    default: module.AgencyDetailAgents,
  })),
);

const AgencyDetailIntegrations = lazy(() =>
  import('./AgencyDetailIntegrations').then((module) => ({
    default: module.AgencyDetailIntegrations,
  })),
);

export const AgencyDetailTabs = () => {
  const [activeTab] = useQueryState<AgencyDetailTab>('tab', {
    defaultValue: AGENCY_DETAIL_TABS.GENERAL,
  });

  return (
    <Suspense fallback={<Spinner containerClassName="py-32" />}>
      {activeTab === AGENCY_DETAIL_TABS.GENERAL && <AgencyDetailGeneral />}
      {activeTab === AGENCY_DETAIL_TABS.ACTIVITY && <AgencyDetailActivity />}
      {activeTab === AGENCY_DETAIL_TABS.OPERATION_AREA && (
        <AgencyDetailOperationArea />
      )}
      {activeTab === AGENCY_DETAIL_TABS.CONTACT && <AgencyDetailContact />}
      {activeTab === AGENCY_DETAIL_TABS.DOCUMENTS && <AgencyDetailDocuments />}
      {activeTab === AGENCY_DETAIL_TABS.SOCIAL_LINKS && (
        <AgencyDetailSocialLinks />
      )}
      {activeTab === AGENCY_DETAIL_TABS.AGENTS && <AgencyDetailAgents />}
      {activeTab === AGENCY_DETAIL_TABS.INTEGRATIONS && (
        <AgencyDetailIntegrations />
      )}
    </Suspense>
  );
};
