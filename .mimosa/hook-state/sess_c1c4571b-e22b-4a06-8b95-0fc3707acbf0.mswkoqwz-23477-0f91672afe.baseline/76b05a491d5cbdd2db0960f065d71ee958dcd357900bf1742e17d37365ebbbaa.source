import { PROJECT_TABS } from '@/project/constants/project';
import { useProjectDetail } from '@/project/hooks/useProjectDetail';
import { Spinner, useQueryState } from 'erxes-ui';
import { Suspense, lazy } from 'react';

const ProjectDetailGeneral = lazy(() =>
  import('./ProjectDetailGeneral').then((module) => ({
    default: module.ProjectDetailGeneral,
  })),
);

const ProjectSpecification = lazy(() =>
  import('./ProjectSpecification').then((module) => ({
    default: module.ProjectSpecification,
  })),
);

const ProjectTarget = lazy(() =>
  import('./ProjectTarget').then((module) => ({
    default: module.ProjectTarget,
  })),
);

const ProjectContact = lazy(() =>
  import('./ProjectContact').then((module) => ({
    default: module.ProjectContact,
  })),
);

const ProjectInsider = lazy(() =>
  import('./ProjectInsider').then((module) => ({
    default: module.ProjectInsider,
  })),
);

const ProjectDetailPrices = lazy(() =>
  import('./ProjectDetailPrices').then((module) => ({
    default: module.ProjectDetailPrices,
  })),
);

const ProjectDetailBuildings = lazy(() =>
  import('./ProjectDetailBuildings').then((module) => ({
    default: module.ProjectDetailBuildings,
  })),
);

const ProjectDetailAmenities = lazy(() =>
  import('./ProjectDetailAmenities').then((module) => ({
    default: module.ProjectDetailAmenities,
  })),
);

const ProjectDetailMedia = lazy(() =>
  import('./ProjectDetailMedia').then((module) => ({
    default: module.ProjectDetailMedia,
  })),
);

const ProjectDetailDocument = lazy(() =>
  import('./ProjectDetailDocument').then((module) => ({
    default: module.ProjectDetailDocument,
  })),
);

const ProjectDetailSeo = lazy(() =>
  import('./ProjectDetailSeo').then((module) => ({
    default: module.ProjectDetailSeo,
  })),
);

const ProjectDetailPolicies = lazy(() =>
  import('./ProjectDetailPolicies').then((module) => ({
    default: module.ProjectDetailPolicies,
  })),
);

const ProjectDetailZoning = lazy(() =>
  import('./ProjectDetailZoning').then((module) => ({
    default: module.ProjectDetailZoning,
  })),
);

const ProjectDetailUnits = lazy(() =>
  import('./ProjectDetailUnits').then((module) => ({
    default: module.ProjectDetailUnits,
  })),
);

const ProjectDetailMembers = lazy(() =>
  import('./ProjectDetailMembers').then((module) => ({
    default: module.ProjectDetailMembers,
  })),
);

const ProjectDetailUnitTypes = lazy(() =>
  import('./ProjectDetailUnitTypes').then((module) => ({
    default: module.ProjectDetailUnitTypes,
  })),
);

const ProjectDetailStatuses = lazy(() =>
  import('./ProjectDetailStatuses').then((module) => ({
    default: module.ProjectDetailStatuses,
  })),
);

const ProjectDetailContractStatuses = lazy(() =>
  import('./ProjectDetailContractStatuses').then((module) => ({
    default: module.ProjectDetailContractStatuses,
  })),
);

export const ProjectDetailTabs = () => {
  const [activeTab] = useQueryState('activeTab', {
    defaultValue: 'general',
  });
  const { loading } = useProjectDetail();

  if (loading) return null;

  return (
    <Suspense fallback={<Spinner containerClassName="py-32" />}>
      {activeTab === PROJECT_TABS.GENERAL && <ProjectDetailGeneral />}
      {activeTab === PROJECT_TABS.SPECIFICATIONS && <ProjectSpecification />}
      {activeTab === PROJECT_TABS.TARGET && <ProjectTarget />}
      {activeTab === PROJECT_TABS.CONTACT && <ProjectContact />}
      {activeTab === PROJECT_TABS.INSIDER && <ProjectInsider />}
      {activeTab === PROJECT_TABS.PRICING && <ProjectDetailPrices />}
      {activeTab === PROJECT_TABS.BUILDINGS && <ProjectDetailBuildings />}
      {activeTab === PROJECT_TABS.ZONES && <ProjectDetailZoning />}
      {activeTab === PROJECT_TABS.AMENITIES && <ProjectDetailAmenities />}
      {activeTab === PROJECT_TABS.UNITS && <ProjectDetailUnits />}
      {activeTab === PROJECT_TABS.MEMBERS && <ProjectDetailMembers />}
      {activeTab === PROJECT_TABS.MEDIA && <ProjectDetailMedia />}
      {activeTab === PROJECT_TABS.DOCUMENTS && <ProjectDetailDocument />}
      {activeTab === PROJECT_TABS.SEO && <ProjectDetailSeo />}
      {activeTab === PROJECT_TABS.POLICIES && <ProjectDetailPolicies />}
      {activeTab === PROJECT_TABS.UNIT_TYPES && <ProjectDetailUnitTypes />}
      {activeTab === PROJECT_TABS.OPPTY_STATUSES && <ProjectDetailStatuses />}
      {activeTab === PROJECT_TABS.CONTRACT_STATUSES && (
        <ProjectDetailContractStatuses />
      )}
    </Suspense>
  );
};
