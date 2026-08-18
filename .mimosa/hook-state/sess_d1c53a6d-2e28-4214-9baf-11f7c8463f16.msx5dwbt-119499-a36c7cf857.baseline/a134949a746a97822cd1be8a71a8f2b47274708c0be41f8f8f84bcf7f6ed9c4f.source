import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router';
import '../styles.css';

const NewsPage = lazy(() =>
  import('../pages/NewsPage').then((module) => ({
    default: module.NewsPage,
  })),
);

const NewsDetail = lazy(() =>
  import('../pages/NewsDetail').then((module) => ({
    default: module.NewsDetail,
  })),
);

const CompanyListPage = lazy(() =>
  import('../pages/CompanyList').then((module) => ({
    default: module.CompanyListPage,
  })),
);

const CompanyInfoPage = lazy(() =>
  import('../pages/CompanyInfoPage').then((module) => ({
    default: module.CompanyInfoPage,
  })),
);

const FormPage = lazy(() =>
  import('../pages/FormPage').then((module) => ({
    default: module.FormPage,
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
        <Route path="forms" element={<FormPage />} />
      </Routes>
    </Suspense>
  );
};

export default Main;
