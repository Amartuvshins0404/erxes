// Display meta for the agent Visibility column. Kept in its own module so the
// unknown-value fallback can be unit-tested without rendering the page.

interface VisibilityMeta {
  label: string;
  variant: 'success' | 'secondary';
}

const VISIBILITY_META: Record<string, VisibilityMeta> = {
  org: { label: 'Org-wide', variant: 'success' },
  team: { label: 'Branch', variant: 'secondary' },
  department: { label: 'Department', variant: 'secondary' },
  unit: { label: 'Team', variant: 'secondary' },
  private: { label: 'Private', variant: 'secondary' },
};

/** Resolve display meta for an agent's visibility, falling back to the 'private'
 *  meta for unknown/missing values so a bad enum can't crash the Agents list. */
export const getVisibilityMeta = (visibility?: string | null): VisibilityMeta =>
  (visibility != null && VISIBILITY_META[visibility]) || VISIBILITY_META.private;
