import { resolveTurnExecutionPolicy } from './executionPolicy';

describe('turn execution policy', () => {
  it('caps tool-enabled turns and serializes tool calls', () => {
    expect(
      resolveTurnExecutionPolicy({ configuredMaxSteps: 50, hasTools: true }),
    ).toEqual({ maxSteps: 12, toolCallConcurrency: 1 });
  });

  it('keeps enough steps for one structured build flow', () => {
    expect(
      resolveTurnExecutionPolicy({ configuredMaxSteps: 1, hasTools: true }),
    ).toEqual({ maxSteps: 3, toolCallConcurrency: 1 });
    expect(resolveTurnExecutionPolicy({ hasTools: true })).toEqual({
      maxSteps: 8,
      toolCallConcurrency: 1,
    });
  });

  it('preserves an explicit limit for tool-free agents', () => {
    expect(
      resolveTurnExecutionPolicy({ configuredMaxSteps: 50, hasTools: false }),
    ).toEqual({ maxSteps: 50, toolCallConcurrency: 1 });
  });
});
