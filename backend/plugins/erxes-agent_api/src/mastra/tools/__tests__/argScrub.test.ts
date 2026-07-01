import { scrubArgs } from '../argScrub';

describe('scrubArgs', () => {
  describe('usersEdit', () => {
    it('drops password, email, and groupIds but keeps details and _id', () => {
      const scrubbed = scrubArgs('usersEdit', {
        _id: 'u1',
        password: 'hunter2',
        email: 'evil@example.com',
        groupIds: ['admin-group'],
        details: { firstName: 'Jane' },
      });
      expect(scrubbed.password).toBeUndefined();
      expect(scrubbed.email).toBeUndefined();
      expect(scrubbed.groupIds).toBeUndefined();
      expect(scrubbed._id).toBe('u1');
      expect(scrubbed.details).toEqual({ firstName: 'Jane' });
    });

    it('is a no-op when none of the risky keys are present', () => {
      const scrubbed = scrubArgs('usersEdit', { _id: 'u1', details: {} });
      expect(scrubbed).toEqual({ _id: 'u1', details: {} });
    });
  });

  describe('usersInvite', () => {
    it('drops permissionGroupIds from each entry but keeps email and password', () => {
      const scrubbed = scrubArgs('usersInvite', {
        entries: [
          {
            email: 'a@example.com',
            password: 'pw',
            permissionGroupIds: ['admin-group'],
          },
          { email: 'b@example.com', permissionGroupIds: ['ops'] },
        ],
      });
      const entries = scrubbed.entries as Array<Record<string, unknown>>;
      expect(entries[0].permissionGroupIds).toBeUndefined();
      expect(entries[0].email).toBe('a@example.com');
      expect(entries[0].password).toBe('pw');
      expect(entries[1].permissionGroupIds).toBeUndefined();
      expect(entries[1].email).toBe('b@example.com');
    });

    it('tolerates a missing or non-array entries field', () => {
      expect(scrubArgs('usersInvite', {})).toEqual({});
      expect(scrubArgs('usersInvite', { entries: null })).toEqual({
        entries: null,
      });
    });
  });

  it('returns args unchanged for an operation with no scrubber', () => {
    const args = { _id: 'd1', name: 'deal', password: 'kept' };
    expect(scrubArgs('dealsAdd', args)).toBe(args);
    expect(args.password).toBe('kept');
  });
});
