import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router';

const AssistantIndexPage = lazy(() =>
  import('~/pages/assistant/IndexPage').then((module) => ({
    default: module.AssistantIndexPage,
  })),
);

const AiAgentsIndexPage = lazy(() =>
  import('~/pages/agents/IndexPage').then((module) => ({
    default: module.AiAgentsIndexPage,
  })),
);

const OpenClawIndexPage = lazy(() =>
  import('~/pages/agent/OpenClawPage').then((module) => ({
    default: module.OpenClawIndexPage,
  })),
);

const AgentTemplatesIndexPage = lazy(() =>
  import('~/pages/agent-templates/IndexPage').then((module) => ({
    default: module.AgentTemplatesIndexPage,
  })),
);

const AgentTemplateDetailPage = lazy(() =>
  import('~/pages/agent-templates/DetailPage').then((module) => ({
    default: module.AgentTemplateDetailPage,
  })),
);

const OpencodeIndexPage = lazy(() =>
  import('~/pages/opencode/IndexPage').then((module) => ({
    default: module.OpencodeIndexPage,
  })),
);

const AgentMain = () => {
  return (
    <Suspense fallback={<div />}>
      <Routes>
        <Route path="/" element={<Navigate to="/agent/assistant" replace />} />
        <Route
          path="agent"
          element={<Navigate to="/agent/assistant" replace />}
        />
        <Route path="assistant" element={<AssistantIndexPage />} />
        <Route path="agents" element={<AiAgentsIndexPage />} />
        <Route path="assistant/:id" element={<OpenClawIndexPage />} />
        <Route path="agents/:id" element={<OpencodeIndexPage />} />
        <Route path="templates" element={<AgentTemplatesIndexPage />} />
        <Route path="templates/:id" element={<AgentTemplateDetailPage />} />
      </Routes>
    </Suspense>
  );
};

export default AgentMain;
