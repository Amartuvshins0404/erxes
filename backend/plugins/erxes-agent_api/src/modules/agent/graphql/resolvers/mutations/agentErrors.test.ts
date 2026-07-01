import mongoose from 'mongoose';
import { ExpectedError } from 'erxes-api-shared/utils';
import { toUserFacingAgentError } from './agentErrors';

describe('toUserFacingAgentError', () => {
  it('maps a mongoose ValidationError to a clean ExpectedError (no stacktrace leak)', () => {
    const schema = new mongoose.Schema({ visibility: { type: String, enum: ['private'] } });
    const Model = mongoose.models.AgentErrTest || mongoose.model('AgentErrTest', schema);
    const raw = new Model({ visibility: 'bogus' }).validateSync() as mongoose.Error.ValidationError;

    const clean = toUserFacingAgentError(raw);

    expect(clean).toBeInstanceOf(ExpectedError);
    expect((clean as ExpectedError).message).toEqual(raw.errors.visibility.message);
  });

  it('maps an E11000 duplicate-key error without leaking the DB namespace', () => {
    const dup = Object.assign(new Error('E11000 duplicate key error collection: erxes.agents index: agentId_1'), {
      code: 11000,
    });

    const clean = toUserFacingAgentError(dup) as ExpectedError;

    expect(clean).toBeInstanceOf(ExpectedError);
    expect(clean.message).toBe('An agent with this ID already exists');
    expect(clean.message).not.toMatch(/erxes|collection|index/i);
  });

  it('passes unrelated errors through untouched', () => {
    const other = new Error('kaboom');
    expect(toUserFacingAgentError(other)).toBe(other);
  });
});
