import { Resolver } from 'erxes-api-shared/core-types';

import { IPost, IPostDocument } from '@/post/@types/post';
import { IContext } from '~/connectionResolvers';
import { sendToAdmin } from '~/utils/adminSync';

const syncPost = (subdomain: string, post: IPostDocument | null) => {
  if (!post) {
    return;
  }

  const { _id, createdAt, updatedAt, ...input } = post.toObject();

  sendToAdmin({
    subdomain,
    path: 'syncPost',
    payload: { entityId: _id, data: { input } },
  });
};

export const postMutations: Record<string, Resolver> = {
  async oroltsooPostAdd(
    _root: undefined,
    { input }: { input: IPost },
    { models, subdomain, checkPermission }: IContext,
  ) {
    await checkPermission('manageOroltsooPosts');

    const post = await models.Post.createPost(input);

    syncPost(subdomain, post);

    return post;
  },

  async oroltsooPostEdit(
    _root: undefined,
    { _id, input }: { _id: string; input: IPost },
    { models, subdomain, checkPermission }: IContext,
  ) {
    await checkPermission('manageOroltsooPosts');

    const post = await models.Post.updatePost(_id, input);

    syncPost(subdomain, post);

    return post;
  },

  async oroltsooPostRemove(
    _root: undefined,
    { _ids }: { _ids: string[] },
    { models, subdomain, checkPermission }: IContext,
  ) {
    await checkPermission('manageOroltsooPosts');

    const { deletedCount } = await models.Post.removePosts(_ids);

    for (const entityId of _ids) {
      sendToAdmin({ subdomain, path: 'removePost', payload: { entityId } });
    }

    return { deletedCount: deletedCount ?? 0 };
  },
};
