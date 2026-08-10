import { IUserDocument } from 'erxes-api-shared/core-types';
import { ExpectedError } from 'erxes-api-shared/utils';

/** Resolve the logged-in user's _id, rejecting unauthenticated calls. */
export function requireUserId(
  user: IUserDocument | null | undefined,
): string {
  if (!user?._id) throw new ExpectedError('Login required');
  return user._id;
}

/**
 * Clamp 1-indexed offset-pagination params to safe bounds: page ≥ 1 and
 * perPage in [1, max] (defaulting when omitted). Shared by the offset-paginated
 * list endpoints so the clamp stays identical everywhere.
 */
export function clampPage(
  page: number | undefined,
  perPage: number | undefined,
  opts: { def: number; max: number },
): { page: number; perPage: number } {
  return {
    page: Math.max(page ?? 1, 1),
    perPage: Math.min(Math.max(perPage ?? opts.def, 1), opts.max),
  };
}
