import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router';
import '../styles.css';

const NewsPage = lazy(() =>
  import('~/pages/NewsPage').then((module) => ({
    default: module.NewsPage,
  })),
);

const NewsDetail = lazy(() =>
  import('~/pages/NewsDetail').then((module) => ({
    default: module.NewsDetail,
  })),
);

const CompanyInfoPage = lazy(() =>
  import('~/pages/CompanyInfoPage').then((module) => ({
    default: module.CompanyInfoPage,
  })),
);

const CompanyListPage = lazy(() =>
  import('../pages/CompanyList').then((module) => ({
    default: module.CompanyListPage,
  })),
);

const Main = () => {
  return (
    <Suspense fallback={<div />}>
      <Routes>
        <Route path="/news" element={<NewsPage />} />
        <Route path="/news/:id" element={<NewsDetail />} />
        <Route path="/companies" element={<CompanyListPage />} />
        <Route path="/companies/:id" element={<CompanyInfoPage />} />
      </Routes>
    </Suspense>
  );
};

export default Main;
