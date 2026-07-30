import { buildAuthHeaders } from '../erxesTools';
import { runWithAuth } from '../../requestContext';

// Tool calls forward the AI team member's short-lived token as a Bearer.
// The decoded principal header stays internal and must never leak outbound.
describe('buildAuthHeaders', () => {
  it('forwards the user token as a Bearer and never a `user` header', async () => {
    await runWithAuth(
      { userHeader: 'forged', token: 'TK', subdomain: 'os' },
      async () => {
        const headers = buildAuthHeaders();
        expect(headers['Authorization']).toBe('Bearer TK');
        expect(headers['hostname']).toBe('os');
        // The internal-only user header must never be sent outbound.
        expect(headers).not.toHaveProperty('user');
      },
    );
  });

  it('fails closed when the AI team-member token is absent', async () => {
    await runWithAuth({ userHeader: 'forged', subdomain: 'os' }, async () => {
      expect(() => buildAuthHeaders()).toThrow('Agent principal unavailable');
    });
  });

  it('stamps the correlation id when a processId is given', async () => {
    await runWithAuth({ token: 'TK', subdomain: 'os' }, async () => {
      const headers = buildAuthHeaders('proc-123');
      expect(headers['x-erxes-process-id']).toBe('proc-123');
      expect(headers['Authorization']).toBe('Bearer TK');
    });
  });
});
