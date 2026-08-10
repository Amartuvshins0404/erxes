import { ApolloClient } from '@apollo/client';
import { MASTRA_THREAD_ARTIFACTS } from '~/graphql/queries';
import { refetchThreadArtifactsIntoCache } from './threadsCache';

type Client = ApolloClient<object>;

describe('refetchThreadArtifactsIntoCache', () => {
  // The fix for EDGEART-005: a file created mid-turn used to stay hidden until a
  // reload. On turn-end the store now issues a network read of the thread's
  // artifacts, which writes through to the cache-and-network query the Files
  // panel watches — so the count updates in place.
  it('issues a network-only artifacts read for the thread', async () => {
    const query = jest.fn().mockResolvedValue({ data: {} });
    const client = { query } as unknown as Client;

    await refetchThreadArtifactsIntoCache(client, 't1');

    expect(query).toHaveBeenCalledWith({
      query: MASTRA_THREAD_ARTIFACTS,
      variables: { threadId: 't1' },
      fetchPolicy: 'network-only',
    });
  });

  it('no-ops without a threadId', async () => {
    const query = jest.fn();
    const client = { query } as unknown as Client;
    await refetchThreadArtifactsIntoCache(client, '');
    expect(query).not.toHaveBeenCalled();
  });

  it('swallows a failed read (best-effort)', async () => {
    const query = jest.fn().mockRejectedValue(new Error('offline'));
    const client = { query } as unknown as Client;
    await expect(
      refetchThreadArtifactsIntoCache(client, 't1'),
    ).resolves.toBeUndefined();
  });
});
