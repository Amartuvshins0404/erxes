import { useAgent } from '../../main/hooks/useAgent';

export const AgentDeployingScreen = () => {
  const { agent } = useAgent();

  return (
    <div className="flex flex-col items-center gap-3 py-2 text-center">
      <div className="border-2 border-primary border-t-transparent rounded-full w-10 h-10 animate-spin" />
      <h3 className="font-medium text-sm">Deploying your agent...</h3>
      <p className="text-muted-foreground text-xs">
        This may take a few minutes. Status: <strong>{agent?.status}</strong>
      </p>
    </div>
  );
};
