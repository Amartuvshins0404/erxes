import { IUserDocument } from 'erxes-api-shared/core-types';

import { IModels } from '~/connectionResolvers';

type TIdentifier = {
  _id: string;
  createdUserId?: unknown;
  memberIds?: unknown[];
};

const normalizeId = (id: unknown) => (id ? String(id) : '');

export const requireUser = (user?: IUserDocument) => {
  if (!user?._id) {
    throw new Error('User not authenticated');
  }

  return user;
};

export const isAdminUser = (user?: IUserDocument) => {
  return !!user?.isOwner;
};

export const buildIdentifierAccessQuery = (user?: IUserDocument) => {
  const currentUser = requireUser(user);

  if (isAdminUser(currentUser)) {
    return {};
  }

  const currentUserId = normalizeId(currentUser._id);

  return {
    $or: [
      { createdUserId: currentUserId },
      { memberIds: currentUserId },
    ],
  };
};

export const hasIdentifierAccess = (
  identifier: TIdentifier | null | undefined,
  user?: IUserDocument,
) => {
  if (!identifier) {
    return false;
  }

  const currentUser = requireUser(user);

  if (isAdminUser(currentUser)) {
    return true;
  }

  const currentUserId = normalizeId(currentUser._id);

  return (
    normalizeId(identifier.createdUserId) === currentUserId ||
    (identifier.memberIds || []).some(
      (memberId) => normalizeId(memberId) === currentUserId,
    )
  );
};

export const canManageIdentifier = (
  identifier: TIdentifier | null | undefined,
  user?: IUserDocument,
) => {
  if (!identifier) {
    return false;
  }

  const currentUser = requireUser(user);

  return (
    isAdminUser(currentUser) ||
    normalizeId(identifier.createdUserId) === normalizeId(currentUser._id)
  );
};

export const assertIdentifierAccess = async (
  models: IModels,
  identifierId: string,
  user?: IUserDocument,
) => {
  if (!identifierId) {
    throw new Error('identifierId is required');
  }

  const identifier = await models.Identifier.findById(identifierId).lean();

  if (!identifier) {
    throw new Error('Identifier not found');
  }

  if (!hasIdentifierAccess(identifier, user)) {
    throw new Error('You do not have permission to access this identifier');
  }

  return identifier;
};

export const assertIdentifierManageAccess = async (
  models: IModels,
  identifierId: string,
  user?: IUserDocument,
) => {
  const identifier = await assertIdentifierAccess(models, identifierId, user);

  if (!canManageIdentifier(identifier, user)) {
    throw new Error('You do not have permission to manage this identifier');
  }

  return identifier;
};
