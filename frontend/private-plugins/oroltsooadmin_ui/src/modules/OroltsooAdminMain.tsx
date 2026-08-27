import { Spinner } from 'erxes-ui';
import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router';

const ProfilesPage = lazy(() =>
  import('~/pages/profile/IndexPage').then((module) => ({
    default: module.IndexPage,
  })),
);

const ProfileDetailPage = lazy(() =>
  import('~/pages/profile/DetailPage').then((module) => ({
    default: module.DetailPage,
  })),
);

const PostsPage = lazy(() =>
  import('~/pages/post/IndexPage').then((module) => ({
    default: module.IndexPage,
  })),
);

const PostDetailPage = lazy(() =>
  import('~/pages/post/DetailPage').then((module) => ({
    default: module.DetailPage,
  })),
);

export const OroltsooAdminMain = () => (
  <Suspense fallback={<Spinner containerClassName="py-32" />}>
    <Routes>
      <Route index element={<Navigate to="profiles" replace />} />
      <Route path="profiles" element={<ProfilesPage />} />
      <Route path="profiles/:profileId" element={<ProfileDetailPage />} />
      <Route path="posts" element={<PostsPage />} />
      <Route path="posts/:postId" element={<PostDetailPage />} />
    </Routes>
  </Suspense>
);
