import { buildAuthHeaders } from '../erxesTools';
import { runWithAuth } from '../../requestContext';

// WS0-step1: the agent forwards identity as `Authorization: Bearer <token>`
// and NEVER a `user` header. The decoded `userHeader` stays in requestContext
// for internal gating only — it must not leak into the outbound headers.
describe('buildAuthHeaders', () => {
  it('forwards the user token as a Bearer and never a `user` header', async () => {
    await runWithAuth(
      { userHeader: 'forged', token: 'TK', subdomain: 'os' },
      async () => {
        const headers = buildAuthHeaders('APPTOKEN');
        expect(headers['Authorization']).toBe('Bearer TK');
        expect(headers['hostname']).toBe('os');
        // The internal-only user header must never be sent outbound.
        expect(headers).not.toHaveProperty('user');
      },
    );
  });

  it('falls back to the app token when no user token is present', async () => {
    await runWithAuth(
      { userHeader: 'forged', subdomain: 'os' },
      async () => {
        const headers = buildAuthHeaders('APPTOKEN');
        expect(headers['Authorization']).toBe('Bearer APPTOKEN');
        expect(headers).not.toHaveProperty('user');
      },
    );
  });

  it('stamps the correlation id when a processId is given', async () => {
    await runWithAuth({ token: 'TK', subdomain: 'os' }, async () => {
      const headers = buildAuthHeaders('APPTOKEN', 'proc-123');
      expect(headers['x-erxes-process-id']).toBe('proc-123');
      expect(headers['Authorization']).toBe('Bearer TK');
    });
  });
});
