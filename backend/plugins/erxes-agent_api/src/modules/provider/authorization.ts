import type { IUserDocument } from 'erxes-api-shared/core-types';
import { ExpectedError } from 'erxes-api-shared/utils';
import { requireActionScope } from '@/_shared/authorization';
import { requireUserId } from '@/_shared/auth';
import type {
  IMastraProviderDocument,
  MastraProviderScope,
} from '@/provider/@types/provider';
import type { ProviderOwner } from '@/provider/db/models/Provider';

export const resolveProviderOwner = async ({
  subdomain,
  user,
  action,
  requestedScope,
}: {
  subdomain: string;
  user?: IUserDocument;
  action: string;
  requestedScope?: MastraProviderScope;
}): Promise<ProviderOwner> => {
  const userId = requireUserId(user);
  const actionScope = await requireActionScope({ subdomain, user, action });
  const providerScope =
    requestedScope ?? (actionScope === 'all' ? 'organization' : 'personal');

  if (providerScope === 'organization') {
    if (actionScope !== 'all') {
      throw new ExpectedError('Provider not found');
    }
    return { scope: 'organization', ownerId: null };
  }

  return { scope: 'personal', ownerId: userId };
};

export const requireProviderAccess = async ({
  provider,
  subdomain,
  user,
  action,
}: {
  provider: IMastraProviderDocument;
  subdomain: string;
  user?: IUserDocument;
  action: string;
}): Promise<ProviderOwner> => {
  const userId = requireUserId(user);
  const actionScope = await requireActionScope({ subdomain, user, action });

  if (provider.ownerId) {
    if (provider.ownerId !== userId) {
      throw new ExpectedError('Provider not found');
    }
    return { scope: 'personal', ownerId: userId };
  }

  if (actionScope !== 'all') {
    throw new ExpectedError('Provider not found');
  }
  return { scope: 'organization', ownerId: null };
};
