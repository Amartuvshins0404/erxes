// Hand-written response interfaces for the schedule GraphQL documents.

export interface ISchedule {
  _id: string;
  name: string;
  description?: string;
  agentId: string;
  cron: string;
  timezone?: string;
  prompt: string;
  isEnabled: boolean;
  threadId: string;
  lastRunAt?: string;
  lastStatus?: 'success' | 'failed' | 'skipped';
  lastError?: string;
  lastReply?: string;
  lastDurationMs?: number;
  runCount: number;
  createdAt: string;
  updatedAt: string;
}

/** Badge variant per run status — skipped is neutral, not a green success. */
export const SCHEDULE_STATUS_VARIANTS = {
  failed: 'destructive',
  skipped: 'secondary',
  success: 'success',
} as const;

/** ms → compact human duration, e.g. 23000 → "23.0s", 640 → "640ms". */
export const formatScheduleDuration = (ms?: number): string | null => {
  if (ms == null) return null;
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
};

export interface ISchedulesQueryResponse {
  mastraSchedules: ISchedule[];
}

export interface IScheduleQueryResponse {
  mastraSchedule: ISchedule | null;
}

/** Trimmed agent shape the schedule agent-picker reads. */
export interface IScheduleAgentOption {
  agentId: string;
  name: string;
  isEnabled: boolean;
}

export interface IScheduleAgentsQueryResponse {
  mastraAgents: IScheduleAgentOption[];
}

/** Outcome echoed back by the "run now" mutation. */
export interface IScheduleRunNowResponse {
  mastraScheduleRunNow: {
    lastStatus?: 'success' | 'failed' | 'skipped';
    lastError?: string;
  } | null;
}
