interface WorkspaceMemorySettings {
  memoryEnabled?: boolean | null;
}

/**
 * Workspace memory is enabled by default for existing tenants. The persisted
 * General Settings switch can disable it globally for every agent.
 */
export function isWorkspaceMemoryEnabled(
  settings: WorkspaceMemorySettings | null | undefined,
): boolean {
  return settings?.memoryEnabled !== false;
}
