import { lazy, Suspense } from 'react';
import {
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';
import { IconRobot, IconSettings } from '@tabler/icons-react';
import { Breadcrumb, Button, Spinner, Tabs } from 'erxes-ui';
import { PageHeader } from 'ui-modules';
import { useAgent } from './hooks/useAgent';
import { useAgentsBasePath } from './hooks/useAgentsBasePath';

// The full editor is scoped to the canonical team-member id.
const AgentFormPage = lazy(() =>
  import('./AgentFormPage').then((m) => ({ default: m.AgentFormPage })),
);

const TABS = [
  { value: 'config', label: 'Settings', icon: IconSettings },
] as const;

type TabValue = (typeof TABS)[number]['value'];

const isTab = (value: string): value is TabValue =>
  TABS.some((t) => t.value === value);

/** Per-agent workspace with every resource scoped to the selected agent. */
export const AgentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const basePath = useAgentsBasePath();
  const { pathname } = useLocation();
  const { agent, loading } = useAgent(id);

  // Active tab = the trailing path segment; anything else falls back so the
  // Settings redirect below (index route) can normalize it.
  const lastSegment = pathname.split('/').filter(Boolean).pop() ?? '';
  const activeTab: TabValue = isTab(lastSegment) ? lastSegment : 'config';

  const detailBase = `${basePath}/${id}`;

  if (loading && !agent) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!agent) {
    return <Navigate to={basePath} replace />;
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader>
        <PageHeader.Start>
          <Breadcrumb>
            <Breadcrumb.List className="gap-1">
              <Breadcrumb.Item>
                <Button variant="ghost" asChild>
                  <Link to={basePath}>
                    <IconRobot />
                    AI Team Members
                  </Link>
                </Button>
              </Breadcrumb.Item>
              <Breadcrumb.Separator />
              <Breadcrumb.Item>
                <span className="font-medium">{agent.accountName}</span>
              </Breadcrumb.Item>
            </Breadcrumb.List>
          </Breadcrumb>
        </PageHeader.Start>
      </PageHeader>

      <div className="px-3 pt-2">
        <Tabs
          value={activeTab}
          onValueChange={(value) => navigate(`${detailBase}/${value}`)}
        >
          <Tabs.List>
            {TABS.map((tab) => (
              <Tabs.Trigger key={tab.value} value={tab.value}>
                <tab.icon className="size-4 mr-1.5" />
                {tab.label}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
        </Tabs>
      </div>

      <div className="flex-1 min-h-0">
        <Suspense
          fallback={
            <div className="flex h-full items-center justify-center">
              <Spinner />
            </div>
          }
        >
          <Routes>
            <Route index element={<Navigate to="config" replace />} />
            <Route path="config" element={<AgentFormPage embedded />} />
            <Route path="*" element={<Navigate to="config" replace />} />
          </Routes>
        </Suspense>
      </div>
    </div>
  );
};
