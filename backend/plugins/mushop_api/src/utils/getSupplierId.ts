// Reads the supplier context that the storefront passes on cp* requests.
export const getSupplierId = (
  headers?: Record<string, unknown>,
): string | undefined => {
  const value = headers?.['erxes-supplier-id'];
  return typeof value === 'string' && value ? value : undefined;
};
