import { IncomingHttpHeaders } from 'http';

export const userHeaderName = 'user';
export const clientPortalHeaderName = 'clientportal';
export const cpUserHeaderName = 'cpuser';

export function extractUserFromHeader(headers: IncomingHttpHeaders): any {
  const userHeader = headers[userHeaderName];
  if (!userHeader) {
    return null;
  }
  if (Array.isArray(userHeader)) {
    throw new Error(`Multiple user headers`);
  }
  const userJson = Buffer.from(userHeader, 'base64').toString('utf-8');
  return JSON.parse(userJson);
}

export const USER_HEADER_OMITTED_FIELDS = [
  'emailSignatures',
  'customFieldsData',
  'propertiesData',
  'links',
  'loginToken',
] as const;

export const HEADER_SIZE_WARN_BYTES = 32 * 1024;

function encodeHeader(name: string, id: string, value: unknown): string {
  const encoded = Buffer.from(JSON.stringify(value), 'utf8').toString('base64');

  if (encoded.length > HEADER_SIZE_WARN_BYTES) {
    console.warn(
      `${name} header is ${encoded.length} bytes for ${id}; requests fail once it passes the service header budget`,
    );
  }

  return encoded;
}

export function compactUserForHeader<T extends Record<string, unknown>>(
  user: T,
): Omit<T, (typeof USER_HEADER_OMITTED_FIELDS)[number]> {
  const omitted: readonly string[] = USER_HEADER_OMITTED_FIELDS;

  return Object.fromEntries(
    Object.entries(user).filter(([field]) => !omitted.includes(field)),
  ) as Omit<T, (typeof USER_HEADER_OMITTED_FIELDS)[number]>;
}

export function setUserHeader(headers: IncomingHttpHeaders, user: any) {
  if (!user) return;
  headers[userHeaderName] = encodeHeader(
    userHeaderName,
    user._id,
    compactUserForHeader(user),
  );
  headers['userid'] = user._id || '';
}
