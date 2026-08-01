interface WorkspaceMemorySettings {
  memoryEnabled?: boolean | null;
}

/**
 * Workspace memory is enabled by default for existing tenants. The persisted
 * General Settings switch can disable it globally; each agent may still opt
 * out with its own memoryEnabled flag.
 */
export function isWorkspaceMemoryEnabled(
  settings: WorkspaceMemorySettings | null | undefined,
): boolean {
  return settings?.memoryEnabled !== false;
}
