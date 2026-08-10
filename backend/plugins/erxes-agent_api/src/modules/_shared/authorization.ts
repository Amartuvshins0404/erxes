import { getGroupActionScope } from 'erxes-api-shared/core-modules';
import { IUserDocument, PermissionScope } from 'erxes-api-shared/core-types';
import { ExpectedError } from 'erxes-api-shared/utils';

export const requireActionScope = async ({
  subdomain,
  user,
  action,
}: {
  subdomain: string;
  user?: IUserDocument;
  action: string;
}): Promise<PermissionScope> => {
  const scope = await getGroupActionScope(subdomain, action, user);

  if (!scope) {
    throw new ExpectedError('Permission required', 'FORBIDDEN');
  }

  return scope;
};
