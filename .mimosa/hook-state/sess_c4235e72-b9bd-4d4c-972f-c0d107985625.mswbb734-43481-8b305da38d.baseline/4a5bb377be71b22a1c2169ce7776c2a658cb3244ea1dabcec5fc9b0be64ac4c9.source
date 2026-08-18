import { useAgent } from '../../main/hooks/useAgent';

export const AgentPendingScreen = () => {
  const { agent } = useAgent();

  return (
    <div className="flex flex-col items-center gap-3 py-2 text-center">
      <h3 className="font-medium text-sm">Awaiting activation</h3>
      <p className="text-muted-foreground text-xs">
        Your agent <strong>{agent?.name}</strong> has been approved and is
        waiting to go active.
      </p>
    </div>
  );
};
