import { ApolloCache } from '@apollo/client';

/**
 * Invalidate every cached skill field after a write so the management table, the
 * editor, and the composer's invocable-skill picker all refetch — a publish or
 * userInvocable toggle changes what the slash picker shows, so it's evicted too.
 */
export const skillCacheUpdate = (cache: ApolloCache<unknown>) => {
  cache.evict({ fieldName: 'mastraSkills' });
  cache.evict({ fieldName: 'mastraSkill' });
  cache.evict({ fieldName: 'mastraSkillVersions' });
  cache.evict({ fieldName: 'mastraInvocableSkills' });
  cache.gc();
};
