import { scrubCredentialLogCollection } from './scrubCredentialLogs';

type TestLog = {
  _id: string;
  payload: unknown;
};

type TestBulkOperation = {
  updateOne: {
    filter: { _id: string };
    update: { $set: { payload: unknown } };
  };
};

type TestCursor = {
  batchSize: (size: number) => TestCursor;
  [Symbol.asyncIterator]: () => AsyncGenerator<TestLog>;
};

describe('scrubCredentialLogCollection', () => {
  it('scrubs only credential-bearing historical payloads and is idempotent', async () => {
    const logs: TestLog[] = [
      {
        _id: 'credential-log',
        payload: {
          headers: {
            authorization: 'Bearer live-session-token',
            'content-type': 'application/json',
          },
          nested: [{ sessionToken: 'live-session-token', retained: 'yes' }],
        },
      },
      {
        _id: 'safe-log',
        payload: { action: 'retain', result: { count: 2 } },
      },
    ];
    const bulkWriteOperations: TestBulkOperation[] = [];
    const cursor: TestCursor = {
      batchSize: () => cursor,
      async *[Symbol.asyncIterator]() {
        yield* logs;
      },
    };
    const collection = {
      find: () => cursor,
      bulkWrite: async (operations: TestBulkOperation[]) => {
        bulkWriteOperations.push(...operations);

        for (const operation of operations) {
          const log = logs.find(
            ({ _id }) => _id === operation.updateOne.filter._id,
          );

          if (log) {
            log.payload = operation.updateOne.update.$set.payload;
          }
        }
      },
    } as unknown as Parameters<typeof scrubCredentialLogCollection>[0];

    const firstRun = await scrubCredentialLogCollection(collection);
    const secondRun = await scrubCredentialLogCollection(collection);

    expect(firstRun).toEqual({ scanned: 2, updated: 1 });
    expect(secondRun).toEqual({ scanned: 2, updated: 0 });
    expect(bulkWriteOperations).toHaveLength(1);
    expect(logs).toEqual([
      {
        _id: 'credential-log',
        payload: {
          headers: { 'content-type': 'application/json' },
          nested: [{ retained: 'yes' }],
        },
      },
      {
        _id: 'safe-log',
        payload: { action: 'retain', result: { count: 2 } },
      },
    ]);
  });
});
