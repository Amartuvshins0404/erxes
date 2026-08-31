import { useMemo } from 'react';

import { ArtifactCard } from './ArtifactCard';
import { splitArtifacts } from './parseArtifacts';
import { Markdown } from '../components/Markdown';

interface IMessageContentProps {
  content: string;
}

/**
 * Splits assistant text into prose and artifact-card segments. A message
 * without complete artifact fences takes the plain-Markdown fast path so
 * ordinary replies render exactly as before.
 */
export const MessageContent = ({ content }: IMessageContentProps) => {
  const segments = useMemo(() => splitArtifacts(content), [content]);
  const only = segments[0];

  if (segments.length === 1 && only?.kind === 'text') {
    return <Markdown content={only.text} />;
  }

  return (
    <div className="flex flex-col gap-3">
      {segments.map((segment, index) =>
        segment.kind === 'text' ? (
          segment.text ? (
            <Markdown key={index} content={segment.text} />
          ) : null
        ) : (
          <ArtifactCard key={index} artifact={segment.artifact} />
        ),
      )}
    </div>
  );
};
