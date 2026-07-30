const getPluginAddress = jest.fn();

jest.mock('erxes-api-shared/utils', () => ({
  getActivePlugins: jest.fn(async () => []),
  getPlugins: jest.fn(async () => []),
  getPluginAddress: (...args: unknown[]) => getPluginAddress(...args),
}));

import {
  buildAuthHeaders,
  executeErxesOperation,
  type ErxesOperationRef,
} from '../erxesTools';
import { runWithAuth } from '../../requestContext';

const USER_HEADER = Buffer.from(
  JSON.stringify({
    _id: 'agent-user-1',
    role: 'user',
    permissionGroupIds: ['sales-team'],
  }),
).toString('base64');

const jsonResponse = (body: unknown) =>
  new Response(JSON.stringify(body), {
    headers: { 'content-type': 'application/json' },
  });

describe('AI team-member subgraph authentication', () => {
  beforeEach(() => {
    getPluginAddress.mockReset();
    jest.restoreAllMocks();
  });

  it('forwards the validated principal through the internal user contract', async () => {
    await runWithAuth(
      { userHeader: USER_HEADER, token: 'must-not-leak', subdomain: 'os' },
      async () => {
        const headers = buildAuthHeaders();
        expect(headers).toEqual({
          user: USER_HEADER,
          hostname: 'os',
        });
        expect(headers).not.toHaveProperty('Authorization');
      },
    );
  });

  it('fails closed without both the principal header and tenant', async () => {
    await runWithAuth(
      { token: 'not-a-fallback', subdomain: 'os' },
      async () => {
        expect(() => buildAuthHeaders()).toThrow('Agent principal unavailable');
      },
    );
    await runWithAuth({ userHeader: USER_HEADER }, async () => {
      expect(() => buildAuthHeaders()).toThrow('Agent principal unavailable');
    });
  });

  it('stamps the correlation id without exposing a bearer', async () => {
    await runWithAuth(
      { userHeader: USER_HEADER, subdomain: 'os' },
      async () => {
        expect(buildAuthHeaders('proc-123')).toEqual({
          user: USER_HEADER,
          hostname: 'os',
          'x-erxes-process-id': 'proc-123',
        });
      },
    );
  });

  it('routes entity lookups and execution to their owning private subgraphs', async () => {
    getPluginAddress.mockImplementation(
      async (service: string) => `http://internal-${service}`,
    );
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockImplementation(async (input, init) => {
        const url = String(input);
        const body = JSON.parse(String(init?.body)) as { query: string };
        const headers = init?.headers as Record<string, string>;
        expect(headers.user).toBe(USER_HEADER);
        expect(headers.hostname).toBe('os');
        expect(headers).not.toHaveProperty('Authorization');

        if (url === 'http://internal-core/graphql') {
          expect(body.query).toContain('customers');
          return jsonResponse({
            data: {
              customers: {
                list: [{ _id: 'customer-1', firstName: 'Ada' }],
              },
            },
          });
        }
        if (url === 'http://internal-sales/graphql') {
          expect(body.query).toContain('dealsAdd');
          return jsonResponse({ data: { dealsAdd: 'created' } });
        }
        throw new Error(`Unexpected URL: ${url}`);
      });

    const operation: ErxesOperationRef = {
      operation: 'dealsAdd',
      operationType: 'mutation',
      plugin: 'sales',
      graphqlArgs: [
        {
          name: 'customerId',
          type: { kind: 'SCALAR', name: 'String' },
        },
      ],
      returnType: { kind: 'SCALAR', name: 'String' },
    };

    const result = await runWithAuth(
      {
        userHeader: USER_HEADER,
        principalUserId: 'agent-user-1',
        subdomain: 'os',
      },
      () =>
        executeErxesOperation(
          operation,
          { customerId: 'Ada' },
          {
            erxesApiUrl: 'http://public-gateway.invalid',
            erxesApiToken: 'app-token-is-not-a-principal',
          },
        ),
    );

    expect(result).toBe('created');
    expect(getPluginAddress).toHaveBeenCalledWith('sales');
    expect(getPluginAddress).toHaveBeenCalledWith('core');
    expect(fetchSpy.mock.calls.map(([url]) => String(url))).toEqual([
      'http://internal-core/graphql',
      'http://internal-sales/graphql',
    ]);
  });
});
