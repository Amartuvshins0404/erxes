import { IncomingHttpHeaders } from 'http';
import { sanitizeHeaders } from './sanitize';
import {
  userHeaderName,
  cpUserHeaderName,
  clientPortalHeaderName,
} from './user';
import { erxesSubdomainHeaderName } from './subdomain';

// sanitizeHeaders is the gateway's forged-identity trust boundary: it must strip
// EVERY client-supplied identity header so userMiddleware can only derive identity
// from a verified token. These are pure-function assertions (no gateway needed),
// so they run in CI and fail if the strip is ever narrowed.
describe('sanitizeHeaders', () => {
  it('strips every staff AND client-portal identity header', () => {
    const headers: IncomingHttpHeaders = {
      [erxesSubdomainHeaderName]: 'acme',
      [userHeaderName]: 'Zm9yZ2Vk', // forged base64 staff identity
      userid: 'forged-id',
      [cpUserHeaderName]: 'Zm9yZ2Vk', // forged client-portal user
      [clientPortalHeaderName]: 'Zm9yZ2Vk', // forged client portal
    };

    sanitizeHeaders(headers);

    expect(headers[erxesSubdomainHeaderName]).toBeUndefined();
    expect(headers[userHeaderName]).toBeUndefined();
    expect(headers['userid']).toBeUndefined();
    // Regression guard for the cpuser/clientportal gap a fresh-eyes review caught.
    expect(headers[cpUserHeaderName]).toBeUndefined();
    expect(headers[clientPortalHeaderName]).toBeUndefined();
  });

  it('leaves non-identity headers untouched', () => {
    const headers: IncomingHttpHeaders = {
      authorization: 'Bearer real-token',
      hostname: 'acme.localhost',
      'content-type': 'application/json',
    };

    sanitizeHeaders(headers);

    expect(headers['authorization']).toBe('Bearer real-token');
    expect(headers['hostname']).toBe('acme.localhost');
    expect(headers['content-type']).toBe('application/json');
  });
});
