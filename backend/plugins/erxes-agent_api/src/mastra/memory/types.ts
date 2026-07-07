// ---------------------------------------------------------------------------
// Advanced Memory — shared types.
//
// MemoryContext is the per-turn identity the memory helpers key off (working
// memory, digest attribution). Kept in its own tiny module so importers don't
// depend on any heavy memory implementation file.
// ---------------------------------------------------------------------------

export interface MemoryContext {
  subdomain: string;
  resourceId: string;
  threadId: string;
  agentId: string;
}
