import {
  sanitizeLogDocument,
  sanitizeLogPayload,
  sanitizeLogTransportPayload,
} from './sanitize';

describe('sanitizeLogPayload', () => {
  it('keeps only explicitly allowlisted request headers', () => {
    const sanitizedPayload = sanitizeLogPayload({
      headers: {
        Accept: 'application/json',
        'Accept-Language': ['en', 'mn'],
        Authorization: 'Bearer live-session-token',
        Cookie: 'auth-token=live-session-token',
        'auth-token': 'live-session-token',
        'Proxy-Authorization': 'Basic c2VjcmV0',
        __stripe_mid: 'stripe-cookie-value',
        'X-Request-ID': 'request-123',
        'X-Unapproved-Debug': 'omit-me',
      },
      requestData: {
        'Content-Type': 'application/json',
        Cookie: 'auth-token=live-session-token',
        'X-Forwarded-Proto': 'https',
      },
    });

    expect(sanitizedPayload).toEqual({
      headers: {
        accept: 'application/json',
        'accept-language': ['en', 'mn'],
        'x-request-id': 'request-123',
      },
      requestData: {
        'content-type': 'application/json',
        'x-forwarded-proto': 'https',
      },
    });
  });

  it('retains non-credential custom headers only for after-process transport', () => {
    const payload = {
      requestData: {
        authorization: 'Bearer live-session-token',
        cookie: 'auth-token=live-session-token',
        sessioncode: 'operational-code',
        'x-custom-routing': 'route-a',
      },
    };

    expect(sanitizeLogTransportPayload(payload)).toEqual({
      requestData: {
        sessioncode: 'operational-code',
        'x-custom-routing': 'route-a',
      },
    });
    expect(sanitizeLogPayload(payload)).toEqual({ requestData: {} });
  });

  it('removes nested credentials from payloads, results, and arrays', () => {
    const sanitizedPayload = sanitizeLogPayload({
      action: 'save',
      nested: {
        accessToken: 'live-access-token',
        details: [
          { refreshToken: 'live-refresh-token', retained: 'first' },
          {
            authorization: 'Bearer live-session-token',
            retained: 'second',
          },
          'Bearer raw-live-session-token',
        ],
      },
      result: {
        credentials: { password: 'not-persisted' },
        retained: 'result-metadata',
        serialized: '{"refresh_token":"not-persisted"}',
        jwtInUnexpectedField:
          'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyIn0.signature-value',
        tokenUsage: 42,
        promptTokens: 20,
        version: '1.2.3',
      },
      fullDocument: {
        requestData: '{"to":"+97600000000"}',
      },
    });

    expect(sanitizedPayload).toEqual({
      action: 'save',
      nested: {
        details: [{ retained: 'first' }, { retained: 'second' }],
      },
      result: {
        retained: 'result-metadata',
        tokenUsage: 42,
        promptTokens: 20,
        version: '1.2.3',
      },
      fullDocument: {
        requestData: '{"to":"+97600000000"}',
      },
    });
  });

  it('returns a detached sanitized document without mutating the source', () => {
    const logDocument = {
      action: 'mutation',
      payload: {
        headers: {
          authorization: 'Bearer live-session-token',
          'content-type': 'application/json',
        },
        result: [{ sessionToken: 'live-session-token', id: 'result-1' }],
      },
      source: 'graphql',
    };
    const originalDocument = {
      action: 'mutation',
      payload: {
        headers: {
          authorization: 'Bearer live-session-token',
          'content-type': 'application/json',
        },
        result: [{ sessionToken: 'live-session-token', id: 'result-1' }],
      },
      source: 'graphql',
    };

    const sanitizedDocument = sanitizeLogDocument(logDocument);

    expect(logDocument).toEqual(originalDocument);
    expect(sanitizedDocument).not.toBe(logDocument);
    expect(sanitizedDocument.payload).not.toBe(logDocument.payload);
    expect(sanitizedDocument).toEqual({
      action: 'mutation',
      payload: {
        headers: { 'content-type': 'application/json' },
        result: [{ id: 'result-1' }],
      },
      source: 'graphql',
    });
  });
});
