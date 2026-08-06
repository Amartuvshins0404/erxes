import type { ToolsInput } from '@mastra/core/agent';
import { selectIntentOperationTools } from '../operationPreload';

const operationTools = {
  deals: {
    id: 'deals',
    description: 'Query sales pipeline deals with stage and amount fields',
  },
  users: {
    id: 'users',
    description: 'Query core users and permission details',
  },
  brandsAdd: {
    id: 'brandsAdd',
    description: 'Create a new brand (mutation in products/brands)',
  },
  brands: {
    id: 'brands',
    description: 'Query brands (query in products/brands)',
  },
  customers: {
    id: 'customers',
    description: 'Query contacts and customer profiles',
  },
} as unknown as ToolsInput;

describe('selectIntentOperationTools', () => {
  it('places a matching exact operation on the first model step', () => {
    const selected = selectIntentOperationTools(
      'Show sales pipeline deals grouped by stage and amount',
      operationTools,
    );

    expect(Object.keys(selected)[0]).toBe('deals');
    expect(selected).not.toHaveProperty('users');
    expect(selected).not.toHaveProperty('brandsAdd');
  });

  it('returns no operation for unrelated small talk', () => {
    expect(selectIntentOperationTools('Hello there', operationTools)).toEqual(
      {},
    );
  });

  it('does not preload mutations for read-only requests', () => {
    const selected = selectIntentOperationTools('List brands', operationTools);

    expect(selected).toHaveProperty('brands');
    expect(selected).not.toHaveProperty('brandsAdd');
  });

  it('keeps matching mutations for explicit write requests', () => {
    const selected = selectIntentOperationTools(
      'Create a new brand',
      operationTools,
    );

    expect(selected).toHaveProperty('brandsAdd');
  });
  it('caps the first-step operation schemas at three', () => {
    const customerTools = Object.fromEntries(
      Array.from({ length: 8 }, (_, index) => [
        `customerOperation${index}`,
        {
          id: `customerOperation${index}`,
          description: 'Query customer records',
        },
      ]),
    ) as unknown as ToolsInput;

    expect(
      Object.keys(
        selectIntentOperationTools('Query customer records', customerTools),
      ),
    ).toHaveLength(3);
  });
});
