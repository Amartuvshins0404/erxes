import { isDev } from 'erxes-api-shared/utils';

const { SUPPLIER_API_URL } = process.env;

const POS_PRODUCTS_QUERY = `
  query PoscProducts($perPage: Int) {
    poscProducts(perPage: $perPage) {
      _id
      name
      description
      code
      shortName
      type
      barcodes
      barcodeDescription
      unitPrice
      savedRemainder
      categoryId
      customFieldsData
      customFieldsDataByFieldCode
      propertiesData
      createdAt
      tagIds
      vendorId
      uom
      subUoms
      currency
      remainder
      soonIn
      soonOut
      remainders
      isCheckRem
      hasSimilarity
      attachment {
        url
        name
        type
        size
        duration
      }
      attachmentMore {
        url
        name
        type
        size
        duration
      }
      pdfAttachment {
        pdf {
          url
          name
          type
          size
          duration
        }
        pages {
          url
          name
          type
          size
          duration
        }
      }
      category {
        _id
        name
        code
        order
        parentId
      }
    }
  }
`;

export const fetchSupplierPosProducts = async ({
  subdomain,
  posToken,
}: {
  subdomain: string;
  posToken: string;
}): Promise<any[]> => {
  if (!SUPPLIER_API_URL) return [];

  const url = isDev
    ? 'http://localhost:4000'
    : SUPPLIER_API_URL.replace('<subdomain>', subdomain);

  const res = await fetch(`${url}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'erxes-pos-token': posToken,
    },
    body: JSON.stringify({
      query: POS_PRODUCTS_QUERY,
      variables: { perPage: 9999 },
    }),
    signal: AbortSignal.timeout(30000),
  });

  console.log('res', res);

  if (!res.ok) {
    console.error(
      `fetchSupplierPosProducts: HTTP ${res.status} from ${url}/graphql`,
    );
    return [];
  }

  const json: any = await res.json();

  if (json?.errors?.length) {
    console.error('fetchSupplierPosProducts GQL errors:', json.errors);
  }

  return json?.data?.poscProducts ?? [];
};
