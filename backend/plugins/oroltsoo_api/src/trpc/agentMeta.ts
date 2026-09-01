export const agentMeta = (
  description: string,
  permission: { module: string; action: string },
) => ({
  agent: { description, permission },
});
