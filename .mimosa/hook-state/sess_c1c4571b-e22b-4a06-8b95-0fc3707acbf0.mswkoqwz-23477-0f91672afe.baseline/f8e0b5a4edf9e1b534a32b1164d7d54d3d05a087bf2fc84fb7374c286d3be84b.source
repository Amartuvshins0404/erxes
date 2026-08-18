import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router';
import { Spinner } from 'erxes-ui';
import { useOneFitInstanceId } from '@/config/hooks/useOneFitInstanceId';
import { useOneFitMode } from './config/hooks/useOneFitMode';
import { OneFitOnboardingPage } from '~/pages/OneFitOnboardingPage';

const IndexPage = lazy(() =>
  import('~/pages/IndexPage').then((module) => ({
    default: module.IndexPage,
  })),
);

const DashboardPage = lazy(() =>
  import('~/pages/DashboardPage').then((module) => ({
    default: module.DashboardPage,
  })),
);

const BookingsPage = lazy(() =>
  import('~/pages/BookingsPage').then((module) => ({
    default: module.BookingsPage,
  })),
);

const SchedulesPage = lazy(() =>
  import('~/pages/SchedulesPage').then((module) => ({
    default: module.SchedulesPage,
  })),
);

const ActivityTypesPage = lazy(() =>
  import('~/pages/ActivityTypesPage').then((module) => ({
    default: module.ActivityTypesPage,
  })),
);

const CategoriesPage = lazy(() =>
  import('~/pages/CategoriesPage').then((module) => ({
    default: module.CategoriesPage,
  })),
);

const MembershipPlansPage = lazy(() =>
  import('~/pages/MembershipPlansPage').then((module) => ({
    default: module.MembershipPlansPage,
  })),
);

const CreditTransactionsPage = lazy(() =>
  import('~/pages/CreditTransactionsPage').then((module) => ({
    default: module.CreditTransactionsPage,
  })),
);

const MembershipPurchasesPage = lazy(() =>
  import('~/pages/MembershipPurchasesPage').then((module) => ({
    default: module.MembershipPurchasesPage,
  })),
);

const MembershipPurchaseReportPage = lazy(() =>
  import('~/pages/MembershipPurchaseReportPage').then((module) => ({
    default: module.MembershipPurchaseReportPage,
  })),
);

const OneFitCustomersPage = lazy(() =>
  import('~/pages/OneFitCustomersPage').then((module) => ({
    default: module.OneFitCustomersPage,
  })),
);

const OneFitCustomerDetailPage = lazy(() =>
  import('~/pages/OneFitCustomerDetailPage').then((module) => ({
    default: module.OneFitCustomerDetailPage,
  })),
);

const ProvidersPage = lazy(() =>
  import('~/pages/ProvidersPage').then((module) => ({
    default: module.ProvidersPage,
  })),
);

const AccountStatementPage = lazy(() =>
  import('~/pages/AccountStatementPage').then((module) => ({
    default: module.AccountStatementPage,
  })),
);

const BannersPage = lazy(() =>
  import('~/pages/BannersPage').then((module) => ({
    default: module.BannersPage,
  })),
);

const PromoCodesPage = lazy(() =>
  import('~/pages/PromoCodesPage').then((module) => ({
    default: module.PromoCodesPage,
  })),
);

const CreditConsumptionPage = lazy(() =>
  import('~/pages/CreditConsumptionPage').then((module) => ({
    default: module.CreditConsumptionPage,
  })),
);

const OneFitMain = () => {
  const { isSlaveMode } = useOneFitMode();
  const { instanceId, loading } = useOneFitInstanceId();

  const hasInstanceId = Boolean(instanceId) && String(instanceId).trim() !== '';

  const requireInstanceId = isSlaveMode && !hasInstanceId;

  if (isSlaveMode && loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Spinner />
      </div>
    );
  }

  if (requireInstanceId) {
    return <OneFitOnboardingPage />;
  }

  return (
    <Suspense fallback={<div />}>
      <Routes>
        <Route path="/" element={<IndexPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/bookings" element={<BookingsPage />} />
        <Route path="/schedules" element={<SchedulesPage />} />
        <Route path="/activity-types" element={<ActivityTypesPage />} />
        {!isSlaveMode && (
          <Route path="/categories" element={<CategoriesPage />} />
        )}
        {!isSlaveMode && (
          <Route path="/membership-plans" element={<MembershipPlansPage />} />
        )}
        {!isSlaveMode && (
          <Route
            path="/credit-transactions"
            element={<CreditTransactionsPage />}
          />
        )}
        {!isSlaveMode && (
          <Route
            path="/membership-purchases"
            element={<MembershipPurchasesPage />}
          />
        )}
        {!isSlaveMode && (
          <Route
            path="/reports/membership-purchases"
            element={<MembershipPurchaseReportPage />}
          />
        )}
        {!isSlaveMode && (
          <Route path="/customers" element={<OneFitCustomersPage />} />
        )}
        {!isSlaveMode && (
          <Route path="/customers/:id" element={<OneFitCustomerDetailPage />} />
        )}
        <Route path="/providers" element={<ProvidersPage />} />

        <Route
          path="/providers/account-statement"
          element={<AccountStatementPage />}
        />

        {!isSlaveMode && (
          <Route
            path="/credit-consumption"
            element={<CreditConsumptionPage />}
          />
        )}
        {!isSlaveMode && <Route path="/banners" element={<BannersPage />} />}
        {!isSlaveMode && (
          <Route path="/promo-codes" element={<PromoCodesPage />} />
        )}
      </Routes>
    </Suspense>
  );
};

export default OneFitMain;
