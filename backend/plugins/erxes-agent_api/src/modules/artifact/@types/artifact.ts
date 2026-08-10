import { Document } from 'mongoose';

export interface IWebsiteFileReference {
  path: string;
  fileKey: string;
  mimeType: string;
  size: number;
  sha256: string;
  inline?: boolean;
}

// A chart, generated document, or static website the agent produced in chat,
// persisted independently from the per-message native-store metadata. Powers
// the Preview panel's per-thread artifact list. One row per artifact id.
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
  initiatorUserId?: string;
  kind: 'chart' | 'document' | 'diagram' | 'image' | 'website';
  // Mermaid diagram definition (diagram artifacts only).
  definition?: string;
  format?: string;
  title: string;
  fileName?: string;
  mimeType?: string;
  // Storage key (read via core /read-file) or an inline data:/http URL.
  fileKey?: string;
  inline?: boolean;
  size?: number;
  // Image artifacts only (px).
  width?: number;
  height?: number;
  // Ordered per-slide image refs (pptx only) — each resolved exactly like
  // fileKey (storage key or inline data:/http URL). Powers the Present mode +
  // slide deck after a reload.
  slides?: string[];
  slideCount?: number;
  // Static website artifacts keep one private-storage reference per member
  // file. The list query excludes this manifest; only the capability route
  // reads it when serving a concrete page or asset.
  entryPath?: string;
  fileCount?: number;
  contentHash?: string;
  previewToken?: string;
  websiteFiles?: IWebsiteFileReference[];
  // Chart artifacts carry their sanitized ChartSpec for re-rendering.
  spec?: Record<string, unknown>;
  createdAt?: Date;
}

export interface IMastraArtifactDocument extends IMastraArtifact, Document {
  _id: string;
}
