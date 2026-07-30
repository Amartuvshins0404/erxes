import { createHmac } from 'node:crypto';
import { redis } from 'erxes-api-shared/utils';
import type { AgentAccount } from './servicePrincipal';
import { isAgentAccount } from './servicePrincipal';

const RUN_TOKEN_TTL_SECONDS = 60 * 60;

const encodeSegment = (value: object): string =>
  Buffer.from(JSON.stringify(value)).toString('base64url');

const signRunToken = (userId: string, secret: string): string => {
  const issuedAt = Math.floor(Date.now() / 1000);
  const unsigned = `${encodeSegment({
    alg: 'HS256',
    typ: 'JWT',
  })}.${encodeSegment({
    user: { _id: userId, isOwner: false },
    iat: issuedAt,
    exp: issuedAt + RUN_TOKEN_TTL_SECONDS,
  })}`;
  const signature = createHmac('sha256', secret)
    .update(unsigned)
    .digest('base64url');
  return `${unsigned}.${signature}`;
};

/**
 * Mint the short-lived token used by this plugin's validated AI team-member
 * principal. This reproduces the gateway's existing user-token contract
 * locally, so the plugin does not require an agent-specific core API.
 */
export async function mintRunToken(opts: {
  account: AgentAccount;
}): Promise<string | undefined> {
  const { account } = opts;
  if (
    !account._id?.trim() ||
    !isAgentAccount(account) ||
    account.isActive === false
  ) {
    return undefined;
  }

  const secret = process.env.JWT_TOKEN_SECRET || 'SECRET';
  if (process.env.NODE_ENV === 'production' && secret === 'SECRET') {
    return undefined;
  }

  try {
    const token = signRunToken(account._id, secret);
    await redis.set(
      `user-token-${account._id}-${token}`,
      '1',
      'EX',
      RUN_TOKEN_TTL_SECONDS,
    );
    return token;
  } catch {
    return undefined;
  }
}
