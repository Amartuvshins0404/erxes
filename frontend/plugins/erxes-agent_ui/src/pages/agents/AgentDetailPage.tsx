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
import {
  IconBook2,
  IconBulb,
  IconCalendarTime,
  IconRobot,
  IconSettings,
  IconShieldLock,
  IconSitemap,
} from '@tabler/icons-react';
import {
  Breadcrumb,
  Button,
  Separator,
  Spinner,
  Tabs,
} from 'erxes-ui';
import { PageHeader } from 'ui-modules';
import { useAgent } from './hooks/useAgent';
import { useAgentsBasePath } from './hooks/useAgentsBasePath';
import { AgentSkillsTab } from './components/AgentSkillsTab';
import { AgentAccessTab } from './components/AgentAccessTab';

// The tab pages are the existing resource index pages, reused in `embedded`
// mode and scoped to this agent's business agentId (workflows/schedules/
// learnings) — plus the shared agent edit form for Settings.
const WorkflowsIndexPage = lazy(() =>
  import('~/pages/workflows/WorkflowsIndexPage').then((m) => ({
    default: m.WorkflowsIndexPage,
  })),
);
const SchedulesIndexPage = lazy(() =>
  import('~/pages/schedules/SchedulesIndexPage').then((m) => ({
    default: m.SchedulesIndexPage,
  })),
);
const LearningsIndexPage = lazy(() =>
  import('~/pages/learnings/LearningsIndexPage').then((m) => ({
    default: m.LearningsIndexPage,
  })),
);
const AgentFormPage = lazy(() =>
  import('./AgentFormPage').then((m) => ({ default: m.AgentFormPage })),
);

const TABS = [
  { value: 'workflows', label: 'Workflows', icon: IconSitemap },
  { value: 'schedules', label: 'Schedules', icon: IconCalendarTime },
  { value: 'skills', label: 'Skills', icon: IconBook2 },
  { value: 'learnings', label: 'Learnings', icon: IconBulb },
  { value: 'access', label: 'Access', icon: IconShieldLock },
  { value: 'config', label: 'Settings', icon: IconSettings },
] as const;

type TabValue = (typeof TABS)[number]['value'];

const isTab = (value: string): value is TabValue =>
  TABS.some((t) => t.value === value);

/**
 * Per-agent workspace: one agent selected from the Agents list, its workflows,
 * schedules, skills, learnings and settings grouped behind tabs. Each tab is the
 * existing resource view, scoped to this agent (see step 25 — per-agent UI).
 */
export const AgentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const basePath = useAgentsBasePath();
  const { pathname } = useLocation();
  const { agent, loading } = useAgent(id);

  // Active tab = the trailing path segment; anything else falls back so the
  // Settings redirect below (index route) can normalize it.
  const lastSegment = pathname.split('/').filter(Boolean).pop() ?? '';
  const activeTab: TabValue = isTab(lastSegment) ? lastSegment : 'workflows';

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
                    Agents
                  </Link>
                </Button>
              </Breadcrumb.Item>
              <Breadcrumb.Separator />
              <Breadcrumb.Item>
                <span className="font-medium">{agent.name}</span>
                <span className="ml-1.5 font-mono text-xs text-muted-foreground">
                  {agent.agentId}
                </span>
              </Breadcrumb.Item>
            </Breadcrumb.List>
          </Breadcrumb>
          <Separator.Inline />
          <PageHeader.FavoriteToggleButton />
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
            <Route index element={<Navigate to="workflows" replace />} />
            <Route
              path="workflows"
              element={
                <WorkflowsIndexPage agentId={agent.agentId} embedded />
              }
            />
            <Route
              path="schedules"
              element={
                <SchedulesIndexPage agentId={agent.agentId} embedded />
              }
            />
            <Route
              path="skills"
              element={
                <AgentSkillsTab
                  agentId={agent._id}
                  skills={agent.skills ?? []}
                />
              }
            />
            <Route
              path="learnings"
              element={
                <LearningsIndexPage agentId={agent.agentId} embedded />
              }
            />
            <Route path="access" element={<AgentAccessTab agent={agent} />} />
            <Route path="config" element={<AgentFormPage embedded />} />
            <Route path="*" element={<Navigate to="workflows" replace />} />
          </Routes>
        </Suspense>
      </div>
    </div>
  );
};
