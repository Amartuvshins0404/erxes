// ---------------------------------------------------------------------------
// Agent Learning — distillation orchestrator.
//
// One thread in, zero-or-more shared lessons out:
//   extract + PII-redact (LLM: distiller agent with a PIIDetector output
//   processor) → dedupe against the existing corpus by normalized statement
//   (merge evidence) → store candidate → auto-promote when the k-anonymity +
//   confidence floors are met.
//
// The contributor is recorded only as HMAC(thread owner id) — identity never
// reaches the shared tier.
// ---------------------------------------------------------------------------

import { IModels } from '~/connectionResolvers';
import { IMastraLearningDocument } from '@/learning/@types/learning';
import { hashSource, resolveLearningTuning } from './config';
import {
  buildTranscript,
  extractCandidates,
  ExtractionRuntime,
  TranscriptMessage,
} from './extractor';

/**
 * Normalize a statement for exact/near-duplicate detection against the Mongo
 * corpus (case/whitespace/punctuation-insensitive). This replaces the vector
 * similarity dedupe: it only catches re-derived lessons phrased identically,
 * but that is the common case for FAQs/procedures and it keeps the k-anonymity
 * counter meaningful without an embedder.
 */
export function normalizeStatement(statement: string): string {
  return statement
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Escape a string for safe use inside a RegExp (dedupe exact-match query). */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export interface DistillResult {
  extracted: number;
  gated: number;
  merged: number;
  created: number;
  promoted: number;
}

/** Promote a candidate when both floors hold. */
async function maybeAutoPromote(
  models: IModels,
  learning: IMastraLearningDocument | null,
): Promise<boolean> {
  if (!learning || learning.status !== 'candidate') return false;
  const tuning = resolveLearningTuning();
  const distinctSources = learning.sourceHashes?.length ?? 0;
  if (
    distinctSources < tuning.autoPromoteMinSources ||
    (learning.confidence ?? 0) < tuning.autoPromoteMinConfidence
  ) {
    return false;
  }
  await models.MastraLearning.setStatus(String(learning._id), 'approved');
  return true;
}

/**
 * Distill the undistilled tail of one thread into the shared knowledge tier.
 * Throws only on extractor failure (the caller skips the cursor update so the
 * thread is retried next sweep); per-candidate failures are contained.
 */
export async function distillThread(params: {
  models: IModels;
  agentId: string;
  ownerResourceId: string; // thread owner — hashed before storage
  messages: TranscriptMessage[];
  runtime: ExtractionRuntime;
  outcome?: string;
}): Promise<DistillResult> {
  const { models, agentId, ownerResourceId, messages, runtime, outcome } =
    params;
  const result: DistillResult = {
    extracted: 0,
    gated: 0,
    merged: 0,
    created: 0,
    promoted: 0,
  };

  const transcript = buildTranscript(messages);
  if (!transcript.trim()) return result;

  // 1. Extract candidates. The distiller agent runs a Mastra PIIDetector output
  //    processor, so every statement is already PII-redacted on the way out —
  //    no raw identifier survives past this point, even in logs.
  const candidates = await extractCandidates(transcript, runtime, outcome);
  result.extracted = candidates.length;
  if (!candidates.length) return result;

  const sourceHash = hashSource(ownerResourceId);

  for (const candidate of candidates) {
    try {
      // 3. Dedupe against this agent's candidates and approved lessons by
      //    normalized statement. A re-derived lesson phrased the same way
      //    merges evidence instead of duplicating, without allowing one agent's
      //    conversations to reinforce or promote another agent's guidance.
      //    Mongo can't normalize server-side without a stored field, so match
      //    case-insensitively on the raw statement and confirm the normalized
      //    form in memory.
      const normalized = normalizeStatement(candidate.statement);
      const existing = await models.MastraLearning.findOne({
        status: { $in: ['candidate', 'approved'] },
        agentId,
        statement: {
          $regex: `^${escapeRegExp(candidate.statement)}$`,
          $options: 'i',
        },
      });
      const similarId =
        existing && normalizeStatement(existing.statement) === normalized
          ? String(existing._id)
          : null;

      if (similarId) {
        const merged = await models.MastraLearning.mergeEvidence(similarId, {
          agentId,
          confidence: candidate.confidence,
          sourceHash,
        });
        result.merged++;
        if (await maybeAutoPromote(models, merged)) result.promoted++;
        continue;
      }

      // 4. New lesson — stored as a candidate, invisible to live turns until
      //    promoted (curation UI or the floors).
      await models.MastraLearning.createLearning({
        statement: candidate.statement,
        type: candidate.type,
        contextTags: candidate.contextTags,
        agentId,
        status: 'candidate',
        confidence: candidate.confidence,
        evidenceCount: 1,
        sourceHashes: [sourceHash],
        createdBy: 'system',
      });
      result.created++;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn(`[mastra:learning] candidate skipped: ${e?.message || e}`);
    }
  }

  return result;
}
