import { Spinner } from 'erxes-ui';
import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router';

const ProfilePage = lazy(() =>
  import('~/pages/profile/IndexPage').then((module) => ({
    default: module.IndexPage,
  })),
);

const PostsPage = lazy(() =>
  import('~/pages/post/IndexPage').then((module) => ({
    default: module.IndexPage,
  })),
);

const MeetingsPage = lazy(() =>
  import('~/pages/meeting/IndexPage').then((module) => ({
    default: module.IndexPage,
  })),
);

export const OroltsooMain = () => (
  <Suspense fallback={<Spinner containerClassName="py-32" />}>
    <Routes>
      <Route index element={<Navigate to="profile" replace />} />
      <Route path="profile" element={<ProfilePage />} />
      <Route path="posts" element={<PostsPage />} />
      <Route path="meetings" element={<MeetingsPage />} />
    </Routes>
  </Suspense>
);
