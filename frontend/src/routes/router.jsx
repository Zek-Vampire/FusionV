import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { LoadingState } from '@/components/ui/States';
import AuthLayout from '@/layouts/AuthLayout';
import PublicLayout from '@/layouts/PublicLayout';
import NotFoundPage from '@/pages/NotFoundPage';
import LoginPage from '@/pages/Auth/LoginPage';
import SignupPage from '@/pages/Auth/SignupPage';
import ProtectedRoute from '@/routes/ProtectedRoute';

/** Public pages from Phase 4 — route-split so the landing page stays small. */
const HomePage = lazy(() => import('@/pages/HomePage'));
const AppLayout = lazy(() => import('@/layouts/AppLayout'));
const DesignSystemPage = lazy(() => import('@/pages/DesignSystemPage'));
const HackathonExplorerPage = lazy(() => import('@/pages/Hackathons/HackathonExplorerPage'));
const HackathonDetailPage = lazy(() => import('@/pages/Hackathons/HackathonDetailPage'));
const ResourcesPage = lazy(() => import('@/pages/Resources/ResourcesPage'));
const ResourceDetailPage = lazy(() => import('@/pages/Resources/ResourceDetailPage'));
const SearchPage = lazy(() => import('@/pages/Search/SearchPage'));

/** Phase 5 authenticated workspace pages, each in its own chunk. */
const DashboardPage = lazy(() => import('@/pages/Dashboard/DashboardPage'));
const TeamsPage = lazy(() => import('@/pages/Teams/TeamsPage'));
const TeamDetailPage = lazy(() => import('@/pages/Teams/TeamDetailPage'));
const CommunityPage = lazy(() => import('@/pages/Community/CommunityPage'));
const StudentsPage = lazy(() => import('@/pages/Students/StudentsPage'));
const StudentProfilePage = lazy(() => import('@/pages/Students/StudentProfilePage'));
const MessagesPage = lazy(() => import('@/pages/Messages/MessagesPage'));
const NotificationsPage = lazy(() => import('@/pages/Notifications/NotificationsPage'));
const ProfilePage = lazy(() => import('@/pages/Profile/ProfilePage'));
const SettingsPage = lazy(() => import('@/pages/Settings/SettingsPage'));
const MyResourcesPage = lazy(() => import('@/pages/Resources/MyResourcesPage'));

const lazyPage = (element, label) => (
  <Suspense
    fallback={
      <div className="py-16">
        <LoadingState label={label} />
      </div>
    }
  >
    {element}
  </Suspense>
);

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { index: true, element: lazyPage(<HomePage />, 'Loading FusionV…') },
      {
        path: 'design-system',
        element: lazyPage(<DesignSystemPage />, 'Loading the design system…'),
      },
      {
        path: 'hackathons',
        element: lazyPage(<HackathonExplorerPage />, 'Loading hackathons…'),
      },
      {
        path: 'hackathons/:hackathonId',
        element: lazyPage(<HackathonDetailPage />, 'Loading hackathon details…'),
      },
      {
        path: 'resources',
        element: lazyPage(<ResourcesPage />, 'Loading resources…'),
      },
      {
        path: 'resources/:resourceId',
        element: lazyPage(<ResourceDetailPage />, 'Loading resource details…'),
      },
      {
        path: 'search',
        element: lazyPage(<SearchPage />, 'Loading search…'),
      },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'signup', element: <SignupPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: lazyPage(<AppLayout />, 'Loading your workspace…'),
        children: [
          {
            path: 'dashboard',
            element: lazyPage(<DashboardPage />, 'Loading your dashboard…'),
          },
          {
            path: 'teams',
            element: lazyPage(<TeamsPage />, 'Loading teams…'),
          },
          {
            path: 'teams/:teamId',
            element: lazyPage(<TeamDetailPage />, 'Loading team details…'),
          },
          {
            path: 'community',
            element: lazyPage(<CommunityPage />, 'Loading the community feed…'),
          },
          {
            path: 'students',
            element: lazyPage(<StudentsPage />, 'Loading students…'),
          },
          {
            path: 'students/:studentId',
            element: lazyPage(<StudentProfilePage />, 'Loading student profile…'),
          },
          {
            path: 'messages',
            element: lazyPage(<MessagesPage />, 'Loading messages…'),
          },
          {
            path: 'notifications',
            element: lazyPage(<NotificationsPage />, 'Loading notifications…'),
          },
          {
            path: 'profile',
            element: lazyPage(<ProfilePage />, 'Loading your profile…'),
          },
          {
            path: 'settings',
            element: lazyPage(<SettingsPage />, 'Loading settings…'),
          },
          {
            path: 'resources/mine',
            element: lazyPage(<MyResourcesPage />, 'Loading your resources…'),
          },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
