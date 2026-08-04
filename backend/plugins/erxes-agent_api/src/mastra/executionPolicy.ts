const DEFAULT_MAX_STEPS = 8;
const MIN_TOOL_STEPS = 3;
const MAX_TOOL_STEPS = 12;

export interface TurnExecutionPolicy {
  maxSteps: number;
  toolCallConcurrency: number;
}

const validStepCount = (value: number | undefined): value is number =>
  Number.isSafeInteger(value) && (value ?? 0) > 0;

export const resolveTurnExecutionPolicy = (params: {
  configuredMaxSteps?: number;
  hasTools: boolean;
}): TurnExecutionPolicy => {
  const configured = validStepCount(params.configuredMaxSteps)
    ? params.configuredMaxSteps
    : DEFAULT_MAX_STEPS;

  if (!params.hasTools) {
    return { maxSteps: configured, toolCallConcurrency: 1 };
  }

  return {
    maxSteps: Math.min(MAX_TOOL_STEPS, Math.max(MIN_TOOL_STEPS, configured)),
    toolCallConcurrency: 1,
  };
};
