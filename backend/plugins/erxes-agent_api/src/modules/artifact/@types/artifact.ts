import { Document } from 'mongoose';

// A chart or generated document the agent produced in a chat, persisted in its
// own collection so it reliably survives reloads (independent of the fragile
// per-message native-store meta). Powers the Preview panel's per-thread file
// list. One row per artifact id.
export interface IMastraArtifact {
  artifactId: string;
  threadId: string;
  // The turn that produced it (groups the Files list by chat instance).
  turnId?: string;
  // The user's prompt for that turn — the Files-list group header.
  prompt?: string;
  // The assistant message id, linked after the turn — lets the chat re-render
  // the inline cards on reload (matched against the rendered message).
  messageId?: string;
  agentId?: string;
  resourceId?: string;
  kind: 'chart' | 'document';
  format?: 'pdf' | 'docx' | 'xlsx' | 'pptx';
  title: string;
  fileName?: string;
  mimeType?: string;
  // Storage key (read via core /read-file) or an inline data:/http URL.
  fileKey?: string;
  inline?: boolean;
  size?: number;
  // Chart artifacts carry their sanitized ChartSpec for re-rendering.
  spec?: Record<string, unknown>;
  createdAt?: Date;
}

export interface IMastraArtifactDocument extends IMastraArtifact, Document {
  _id: string;
}
