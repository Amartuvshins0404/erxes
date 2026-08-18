import { useAgentsList } from '../hooks/useAgentsList';
import { Spinner } from 'erxes-ui';
import { AgentItem } from './AgentItem';
import { AddAgentTrigger } from './AddAgent';

export const Agents = ({
  selectedId,
  setSelectedId,
}: {
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
}) => {
  const { agents, loading } = useAgentsList();

  return loading ? (
    <Spinner />
  ) : (
    <>
      {agents.map((agent) => (
        <AgentItem
          key={agent.id}
          {...agent}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
        />
      ))}
      <AddAgentTrigger />
    </>
  );
};
