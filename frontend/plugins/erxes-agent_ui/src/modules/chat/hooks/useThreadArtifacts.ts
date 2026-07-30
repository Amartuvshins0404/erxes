import { useMemo } from 'react';
import { useQuery } from '@apollo/client';
import type { ChartSpec } from '~/modules/chat/charts';
import { MASTRA_THREAD_ARTIFACTS } from '~/graphql/queries';
import {
  normalizeArtifact,
  type Artifact,
} from '~/modules/chat/lib/artifactNormalize';

// Persisted artifacts for a thread (charts + generated documents), read from the
// dedicated store so they survive reloads. Returns the flat list, a lookup by
// the assistant message id (to re-render inline chat cards), and groups by turn
// (the Files-list "grouped by chat instance").

interface ArtifactRow {
  artifactId?: string;
  _id?: string;
  kind?: string;
  format?: string;
  title?: string;
  fileName?: string;
  mimeType?: string;
  fileKey?: string;
  inline?: boolean;
  size?: number;
  spec?: ChartSpec;
  messageId?: string;
  turnId?: string;
  prompt?: string;
}

export interface ArtifactGroup {
  turnId: string;
  prompt: string;
  items: Artifact[];
  // True once any of this turn's rows carries a messageId — i.e. the backend
  // linked it to its assistant bubble, so the inline cards re-render directly.
  // False groups (legacy rows, or a turn whose id recovery failed) fall back to
  // prompt/order matching on the client (see associateArtifacts).
  linked: boolean;
}

export const useThreadArtifacts = (threadId?: string) => {
  const { data, loading } = useQuery<{ mastraThreadArtifacts: ArtifactRow[] }>(
    MASTRA_THREAD_ARTIFACTS,
    {
      variables: { threadId },
      skip: !threadId,
      fetchPolicy: 'cache-and-network',
    },
  );

  return useMemo(() => {
    const rows = data?.mastraThreadArtifacts ?? [];
    const artifacts: Artifact[] = [];
    const byMessageId = new Map<string, Artifact[]>();
    const groups: ArtifactGroup[] = [];
    const groupMap = new Map<string, ArtifactGroup>();

    for (const row of rows) {
      const artifact = normalizeArtifact(row);
      if (!artifact) continue;
      artifacts.push(artifact);

      if (row.messageId) {
        const list = byMessageId.get(row.messageId) ?? [];
        list.push(artifact);
        byMessageId.set(row.messageId, list);
      }

      // Group by turn; fall back to the artifact id so an unlinked artifact
      // still appears as its own group rather than vanishing.
      const turnId = row.turnId || row.messageId || artifact.id;
      let group = groupMap.get(turnId);
      if (!group) {
        group = { turnId, prompt: row.prompt || '', items: [], linked: false };
        groupMap.set(turnId, group);
        groups.push(group);
      }
      group.items.push(artifact);
      if (row.messageId) group.linked = true;
    }

    return { artifacts, byMessageId, groups, loading: loading && !data };
  }, [data, loading]);
};
