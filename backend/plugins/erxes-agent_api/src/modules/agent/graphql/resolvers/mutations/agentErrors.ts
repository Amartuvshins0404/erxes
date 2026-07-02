import { ExpectedError } from 'erxes-api-shared/utils';

/** Translate mongoose persistence failures into clean, user-facing errors so the
 *  raw ValidationError / E11000 (with its DB namespace + stacktrace) never reaches
 *  the client or Sentry. Non-persistence errors pass through untouched. */
export const toUserFacingAgentError = (error: unknown): unknown => {
  if (error instanceof Error && error.name === 'ValidationError') {
    const fields = (error as { errors?: Record<string, { message?: string }> }).errors;
    const first = fields ? Object.values(fields)[0]?.message : undefined;
    return new ExpectedError(first ?? 'Invalid agent configuration', 'VALIDATION_ERROR');
  }
  if (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: unknown }).code === 11000
  ) {
    return new ExpectedError('An agent with this ID already exists', 'DUPLICATE');
  }
  return error;
};
