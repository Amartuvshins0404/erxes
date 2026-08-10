import {
  getRepeatedToolNames,
  runMutationSerially,
  runToolOnce,
  withToolExecutionControl,
  runWithAuth,
} from '../requestContext';

describe('per-turn tool execution controls', () => {
  it('coalesces concurrent calls with canonically identical arguments', async () => {
    let release!: (value: string) => void;
    const execute = jest.fn(
      () =>
        new Promise<string>((resolve) => {
          release = resolve;
        }),
    );

    await runWithAuth({ turnId: 'turn-1' }, async () => {
      const first = runToolOnce(
        'deals',
        { limit: 10, filter: { a: 1, b: 2 } },
        execute,
      );
      const duplicate = runToolOnce(
        'deals',
        { filter: { b: 2, a: 1 }, limit: 10 },
        execute,
      );

      await Promise.resolve();
      expect(execute).toHaveBeenCalledTimes(1);
      expect(getRepeatedToolNames()).toEqual(['deals']);
      release('done');
      await expect(Promise.all([first, duplicate])).resolves.toEqual([
        'done',
        'done',
      ]);
    });
  });

  it('caches a rejected exact call for the rest of the turn', async () => {
    const failure = new Error('dependency unavailable');
    const execute = jest.fn(() => Promise.reject(failure));

    await runWithAuth({ turnId: 'turn-2' }, async () => {
      await expect(
        runToolOnce('fileReader', { key: 'a' }, execute),
      ).rejects.toBe(failure);
      await expect(
        runToolOnce('fileReader', { key: 'a' }, execute),
      ).rejects.toBe(failure);
      expect(execute).toHaveBeenCalledTimes(1);
    });
  });

  it('serializes mutations without blocking independent reads', async () => {
    const events: string[] = [];
    let releaseFirst!: () => void;
    let markStarted!: () => void;
    const started = new Promise<void>((resolve) => {
      markStarted = resolve;
    });

    await runWithAuth({ turnId: 'turn-3' }, async () => {
      const first = runMutationSerially(
        () =>
          new Promise<string>((resolve) => {
            events.push('first-start');
            markStarted();
            releaseFirst = () => {
              events.push('first-end');
              resolve('first');
            };
          }),
      );
      const second = runMutationSerially(async () => {
        events.push('second');
        return 'second';
      });

      events.push('read');
      await started;
      expect(events).toEqual(['read', 'first-start']);
      releaseFirst();
      await expect(Promise.all([first, second])).resolves.toEqual([
        'first',
        'second',
      ]);
      expect(events).toEqual(['read', 'first-start', 'first-end', 'second']);
    });
  });

  it('applies deduplication to wrapped standalone tools', async () => {
    const execute = jest.fn(async ({ query }: { query: string }) => query);
    const tool = withToolExecutionControl('webSearch', { execute });

    await runWithAuth({ turnId: 'turn-wrapped' }, async () => {
      await expect(
        Promise.all([
          tool.execute({ query: 'erxes' }),
          tool.execute({ query: 'erxes' }),
        ]),
      ).resolves.toEqual(['erxes', 'erxes']);
      expect(execute).toHaveBeenCalledTimes(1);
    });
  });

  it('serializes wrapped side-effecting tools', async () => {
    const events: string[] = [];
    let releaseFirst!: () => void;
    let markStarted!: () => void;
    const started = new Promise<void>((resolve) => {
      markStarted = resolve;
    });
    const execute = ({ name }: { name: string }) => {
      events.push(`${name}-start`);
      if (name === 'first') {
        markStarted();
        return new Promise<string>((resolve) => {
          releaseFirst = () => {
            events.push('first-end');
            resolve(name);
          };
        });
      }
      events.push(`${name}-end`);
      return Promise.resolve(name);
    };
    const tool = withToolExecutionControl(
      'workspaceWrite',
      { execute },
      { serial: true },
    );

    await runWithAuth({ turnId: 'turn-serial-tool' }, async () => {
      const first = tool.execute({ name: 'first' });
      const second = tool.execute({ name: 'second' });
      await started;
      expect(events).toEqual(['first-start']);
      releaseFirst();
      await expect(Promise.all([first, second])).resolves.toEqual([
        'first',
        'second',
      ]);
      expect(events).toEqual([
        'first-start',
        'first-end',
        'second-start',
        'second-end',
      ]);
    });
  });

  it('stops unique tool executions at the turn budget', async () => {
    await runWithAuth({ turnId: 'turn-4', toolCallLimit: 2 }, async () => {
      await runToolOnce('deals', { page: 1 }, async () => 'first');
      await runToolOnce('deals', { page: 2 }, async () => 'second');
      await expect(
        runToolOnce('deals', { page: 3 }, async () => 'third'),
      ).rejects.toThrow('2-tool execution limit');
    });
  });
});
