import { ToolPartView, toolKind } from '~/modules/chat/lib/uiParts';
import { ToolCallRow } from '~/modules/chat/components/ToolCallRow';
import { WebSearchCard } from './WebSearchCard';
import { FetchUrlChip } from './FetchUrlChip';
import { OperationRow } from './OperationRow';
import { CalculatorRow } from './CalculatorRow';

// Picks the Claude-style renderer for a tool call from the presentation
// registry. `artifact` tools never reach here (AgentTrace hides them — they show
// as an ArtifactCard); anything unrecognised falls back to the quiet generic row.
export const ToolBody = ({
  call,
  streaming,
}: {
  call: ToolPartView;
  streaming?: boolean;
}) => {
  switch (toolKind(call.toolName)) {
    case 'web-search':
      return <WebSearchCard call={call} streaming={streaming} />;
    case 'fetch-url':
      return <FetchUrlChip call={call} streaming={streaming} />;
    case 'operation':
      return <OperationRow call={call} streaming={streaming} />;
    case 'calculator':
      return <CalculatorRow call={call} streaming={streaming} />;
    default:
      return <ToolCallRow call={call} streaming={streaming} />;
  }
};
