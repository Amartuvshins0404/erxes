jest.mock('erxes-api-shared/core-modules', () => ({
  splitType: (value: string) => {
    if (!value) {
      return ['', '', ''];
    }

    const [pluginName, rest = ''] = value.split(':');
    const [moduleName = '', collectionType = ''] = rest.split('.');

    return [pluginName, moduleName, collectionType];
  },
}));

jest.mock('erxes-api-shared/utils', () => ({
  escapeRegExp: (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
  validSearchText: (values: string[]) => values.filter(Boolean).join(' '),
}));

const mockRequireCoreTRPC = jest.fn();

jest.mock('../core', () => ({
  requireCoreTRPC: (...args: any[]) => mockRequireCoreTRPC(...args),
  requireArrayResult: (value: unknown, description: string) => {
    if (!Array.isArray(value)) {
      throw new Error(`${description} must return an array`);
    }

    return value;
  },
}));

import {
  buildCarSearchText,
  extractMergeRelations,
  getCarSegmentContentType,
  normalizeMergeCarIds,
  normalizeRelationContentType,
} from '../utils';
import {
  getClientPortalCarIds,
  resolveClientPortalEntityIds,
} from '../clientPortal';
import {
  CAR_SEGMENT_CONTENT_TYPE,
  CORE_COMPANY_CONTENT_TYPE,
  CORE_CUSTOMER_CONTENT_TYPE,
  ROOT_CAR_CONTENT_TYPE,
} from '../constants';

describe('car utils', () => {
  beforeEach(() => {
    mockRequireCoreTRPC.mockReset();
  });

  it('builds search text from the main searchable car fields', () => {
    expect(
      buildCarSearchText({
        plateNumber: '1234-ABC',
        vinNumber: 'VIN-001',
        description: 'Blue SUV',
        categoryId: 'cat-1',
        colorCode: '#00f',
      }),
    ).toContain('VIN-001');

    expect(
      buildCarSearchText({
        plateNumber: '1234-ABC',
        vinNumber: 'VIN-001',
        description: 'Blue SUV',
        categoryId: 'cat-1',
        colorCode: '#00f',
      }),
    ).toContain('Blue SUV');
  });

  it('normalizes legacy and short relation content type names', () => {
    expect(normalizeRelationContentType('car')).toBe(ROOT_CAR_CONTENT_TYPE);
    expect(normalizeRelationContentType('cars')).toBe(ROOT_CAR_CONTENT_TYPE);
    expect(normalizeRelationContentType('customer')).toBe(
      CORE_CUSTOMER_CONTENT_TYPE,
    );
    expect(normalizeRelationContentType('company')).toBe(
      CORE_COMPANY_CONTENT_TYPE,
    );
    expect(normalizeRelationContentType('sales:deal.deal')).toBe('sales:deal');
    expect(normalizeRelationContentType('frontline:ticket.ticket')).toBe(
      'frontline:ticket',
    );
  });

  it('deduplicates non-car relations during merge extraction', () => {
    const relations = [
      {
        entities: [
          { contentType: ROOT_CAR_CONTENT_TYPE, contentId: 'car-1' },
          { contentType: CORE_CUSTOMER_CONTENT_TYPE, contentId: 'customer-1' },
          { contentType: CORE_COMPANY_CONTENT_TYPE, contentId: 'company-1' },
        ],
      },
      {
        entities: [
          { contentType: ROOT_CAR_CONTENT_TYPE, contentId: 'car-2' },
          { contentType: CORE_CUSTOMER_CONTENT_TYPE, contentId: 'customer-1' },
          { contentType: 'sales:deal', contentId: 'deal-1' },
        ],
      },
    ];

    expect(extractMergeRelations(relations, ['car-1', 'car-2'])).toEqual([
      { contentType: CORE_CUSTOMER_CONTENT_TYPE, contentId: 'customer-1' },
      { contentType: CORE_COMPANY_CONTENT_TYPE, contentId: 'company-1' },
      { contentType: 'sales:deal', contentId: 'deal-1' },
    ]);
  });

  it('exposes the cars segment content type', () => {
    expect(getCarSegmentContentType()).toBe(CAR_SEGMENT_CONTENT_TYPE);
  });

  it('normalizes merge source ids before model work starts', () => {
    expect(normalizeMergeCarIds(['car-1', '', 'car-2', 'car-1'])).toEqual([
      'car-1',
      'car-2',
    ]);
  });

  it('resolves client portal relation ids from the authenticated cp user', () => {
    expect(
      resolveClientPortalEntityIds(
        {
          _id: 'cp-user-1',
          erxesCustomerId: 'customer-1',
          erxesCompanyId: 'company-1',
        },
        { customerId: 'customer-1' },
      ),
    ).toEqual({
      customerId: 'customer-1',
      companyId: undefined,
    });

    expect(() =>
      resolveClientPortalEntityIds(
        { _id: 'cp-user-1', erxesCustomerId: 'customer-1' },
        { customerId: 'customer-2' },
      ),
    ).toThrow('Client portal customer mismatch');
  });

  it('loads unique client portal car ids from customer and company relations', async () => {
    mockRequireCoreTRPC
      .mockResolvedValueOnce(['car-1', 'car-2'])
      .mockResolvedValueOnce(['car-2', 'car-3', '']);

    await expect(
      getClientPortalCarIds('test-subdomain', {
        customerId: 'customer-1',
        companyId: 'company-1',
      }),
    ).resolves.toEqual(['car-1', 'car-2', 'car-3']);

    expect(mockRequireCoreTRPC).toHaveBeenCalledWith({
      subdomain: 'test-subdomain',
      module: 'relation',
      action: 'getRelationIds',
      input: {
        contentType: CORE_CUSTOMER_CONTENT_TYPE,
        contentId: 'customer-1',
        relatedContentType: ROOT_CAR_CONTENT_TYPE,
      },
    });
    expect(mockRequireCoreTRPC).toHaveBeenCalledWith({
      subdomain: 'test-subdomain',
      module: 'relation',
      action: 'getRelationIds',
      input: {
        contentType: CORE_COMPANY_CONTENT_TYPE,
        contentId: 'company-1',
        relatedContentType: ROOT_CAR_CONTENT_TYPE,
      },
    });
  });
});
