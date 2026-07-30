const publish = jest.fn();
const isEnabled = jest.fn();

jest.mock('erxes-api-shared/utils', () => ({
  graphqlPubsub: { publish: (...args: unknown[]) => publish(...args) },
  isEnabled: (...args: unknown[]) => isEnabled(...args),
}));

import type { IContext } from '~/connectionResolvers';
import type { IInternalNote } from '~/modules/internalNote/types';
import { internalNoteMutations } from './mutations';

beforeEach(() => {
  publish.mockReset();
  isEnabled.mockReset();
  isEnabled.mockResolvedValue(true);
});

describe('internalNotesAdd mentions', () => {
  it('creates and publishes one standard notification per mentioned user', async () => {
    const note = {
      _id: { toString: () => 'note-1' },
      content: 'Please review',
    };
    const createNotification = jest.fn(
      async (doc: Record<string, unknown>) => ({
        ...doc,
        toObject: () => ({ _id: `notification-${doc.userId}`, ...doc }),
      }),
    );
    const checkPermission = jest.fn().mockResolvedValue(undefined);
    const context = {
      user: {
        _id: 'human-1',
        email: 'owner@example.com',
        username: 'owner',
        details: { fullName: 'Account Owner' },
      },
      subdomain: 'os',
      checkPermission,
      models: {
        InternalNotes: {
          createInternalNote: jest.fn().mockResolvedValue(note),
        },
        Notifications: { create: createNotification },
        ActivityLogs: { create: jest.fn() },
      },
    } as unknown as IContext;
    const args = {
      contentType: 'sales:deal',
      content: 'Please review',
      mentionedUserIds: ['agent-user-1', 'agent-user-1', 'human-1'],
    } as IInternalNote;

    await internalNoteMutations.internalNotesAdd(undefined, args, context);

    expect(checkPermission).toHaveBeenCalledWith('internalNotesManage');
    expect(createNotification).toHaveBeenCalledTimes(1);
    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'agent-user-1',
        fromUserId: 'human-1',
        contentType: 'sales:deal',
        action: 'mentioned',
        message: 'Account Owner mentioned you in sales:deal',
        metadata: { noteId: 'note-1' },
      }),
    );
    expect(publish).toHaveBeenCalledWith(
      'notificationInserted:os:agent-user-1',
      {
        notificationInserted: expect.objectContaining({
          userId: 'agent-user-1',
          action: 'mentioned',
        }),
      },
    );
  });
});
