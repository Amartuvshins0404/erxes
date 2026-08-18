import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router';
import '../styles.css';
import { BlocktestPageEffect } from './BlocktestPageEffect';

const ContractsPage = lazy(() =>
  import('~/pages/ContractsPage').then((module) => ({
    default: module.ContractsPage,
  })),
);

const ClientsPage = lazy(() =>
  import('~/pages/ClientsPage').then((module) => ({
    default: module.ClientsPage,
  })),
);

const MarketsPage = lazy(() =>
  import('~/pages/MarketsPage').then((module) => ({
    default: module.MarketsPage,
  })),
);

const RiskGroupsPage = lazy(() =>
  import('~/pages/RiskGroupsPage').then((module) => ({
    default: module.RiskGroupsPage,
  })),
);

const blocktestMain = () => {
  return (
    <Suspense fallback={<div />}>
      <Routes>
        <Route path="/contracts" element={<ContractsPage />} />
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/markets" element={<MarketsPage />} />
        <Route path="/risk-groups" element={<RiskGroupsPage />} />
      </Routes>
      <BlocktestPageEffect />
    </Suspense>
  );
};

export default blocktestMain;
