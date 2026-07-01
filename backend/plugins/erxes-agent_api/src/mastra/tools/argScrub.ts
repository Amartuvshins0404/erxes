// Argument scrubbing for operations that are too useful to fully block but carry
// fields the agent must never be allowed to set. Unlike the security denylist
// (which refuses the whole operation) and the destructive guard (which gates on
// approval), this strips specific high-risk keys from the args and lets the rest
// of the call through.
//
// The canonical cases are `usersEdit` and `usersInvite`: both are legitimately
// useful (renaming a teammate, inviting a colleague) but each carries an
// escalation/takeover primitive — `password`/`email`/`groupIds` on edit, and
// `permissionGroupIds` on invite. We delete those keys rather than blocking the
// op, so the safe parts stay usable.

/** Scrubs the named args of one operation in place and returns the same object. */
type ArgScrubber = (args: Record<string, unknown>) => Record<string, unknown>;

/**
 * usersEdit: drop the keys that would let the agent take over or escalate an
 * account — `password` (credential takeover), `email` (identity/reset vector),
 * and `groupIds` (permission-group membership). Profile fields like `details`
 * and the target `_id` are left untouched.
 */
const scrubUsersEdit: ArgScrubber = (args) => {
  delete args.password;
  delete args.email;
  delete args.groupIds;
  return args;
};

/**
 * usersInvite: for every invited entry, drop `permissionGroupIds` so an invite
 * can never seed a new account into a privileged group. The invitation itself
 * (email, role, password) is preserved.
 */
const scrubUsersInvite: ArgScrubber = (args) => {
  const entries = args.entries;
  if (Array.isArray(entries)) {
    for (const entry of entries) {
      if (entry && typeof entry === 'object') {
        delete (entry as Record<string, unknown>).permissionGroupIds;
      }
    }
  }
  return args;
};

// Operation name → scrubber. Operations absent from this map pass through
// unchanged. Matched EXACTLY, like the security denylist.
const ARG_SCRUBBERS: Record<string, ArgScrubber> = {
  usersEdit: scrubUsersEdit,
  usersInvite: scrubUsersInvite,
};

/**
 * Strips the high-risk keys from an operation's args before it is turned into a
 * GraphQL call. Pure with respect to the operation set (no I/O); mutates and
 * returns the passed args object for the operations it covers, and returns the
 * args unchanged for every other operation. O(N) over the args.
 */
export function scrubArgs(
  operation: string,
  args: Record<string, unknown>,
): Record<string, unknown> {
  const scrubber = ARG_SCRUBBERS[operation];
  return scrubber ? scrubber(args) : args;
}
