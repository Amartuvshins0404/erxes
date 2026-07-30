import { graphqlPubsub, isEnabled } from 'erxes-api-shared/utils';
import { IContext } from '~/connectionResolvers';
import { IInternalNote } from '~/modules/internalNote/types';

export const internalNoteMutations = {
  /**
   * Adds internalNote object and also adds an activity log
   */
  async internalNotesAdd(
    _root: undefined,
    args: IInternalNote,
    { user, models, subdomain, checkPermission }: IContext,
  ) {
    await checkPermission('internalNotesManage');

    const { contentType, contentTypeId, mentionedUserIds = [] } = args;

    const [pluginName, moduleName] = contentType.split(':');

    const isServiceAvailable = await isEnabled(pluginName);
    if (!isServiceAvailable) {
      return null;
    }

    const note = await models.InternalNotes.createInternalNote(args, user);

    const uniqueMentionedUserIds = [...new Set(mentionedUserIds)].filter(
      (userId) => userId !== user._id,
    );
    if (uniqueMentionedUserIds.length) {
      const actorName =
        user.details?.fullName ||
        user.email ||
        user.username ||
        'A team member';
      const notifications = await Promise.all(
        uniqueMentionedUserIds.map((userId) =>
          models.Notifications.create({
            title: `${moduleName} mention`,
            message: `${actorName} mentioned you in ${contentType}`,
            type: 'info',
            userId,
            fromUserId: user._id,
            contentType,
            contentTypeId,
            action: 'mentioned',
            kind: 'user',
            priority: 'medium',
            priorityLevel: 2,
            isRead: false,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            metadata: { noteId: note._id.toString() },
          }),
        ),
      );

      for (const notification of notifications) {
        await graphqlPubsub.publish(
          `notificationInserted:${subdomain}:${notification.userId}`,
          { notificationInserted: notification.toObject() },
        );
      }
    }

    if (contentTypeId) {
      try {
        const actorData = {
          _id: user._id,
          email: user.email,
          username: user.username,
          details: user.details,
          role: user.role,
        };

        const activityLog = await models.ActivityLogs.create({
          activityType: 'internalNote',
          targetId: contentTypeId,
          targetType: contentType,
          target: { _id: contentTypeId },
          action: {
            type: 'create',
            description: 'added a note',
          },
          metadata: {
            noteId: note._id.toString(),
            content: note.content,
          },
          changes: {},
          actorType: user.role || 'user',
          actor: actorData,
        });

        graphqlPubsub.publish(
          `activityLogInserted:${subdomain}:${contentTypeId}`,
          {
            activityLogInserted: activityLog.toObject(),
          },
        );
      } catch (e) {
        console.error('Failed to create activity log for internal note', e, {
          contentTypeId,
          contentType,
        });
      }
    }

    return note;
  },

  /**
   * Updates internalNote object
   */
  async internalNotesEdit(
    _root,
    { _id, ...doc }: IInternalNote & { _id: string },
    { models, checkPermission }: IContext,
  ) {
    await checkPermission('internalNotesManage');

    graphqlPubsub.publish('activityLogsChanged', {});

    return models.InternalNotes.updateInternalNote(_id, doc);
  },

  /**
   * Removes an internal note
   */
  async internalNotesRemove(
    _root,
    { _id }: { _id: string },
    { models, checkPermission }: IContext,
  ) {
    await checkPermission('internalNotesManage');

    graphqlPubsub.publish('activityLogsChanged', {});

    return models.InternalNotes.removeInternalNote(_id);
  },
};
