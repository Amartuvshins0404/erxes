import { canGroup, getGroupActionsMap } from 'erxes-api-shared/core-modules';
import {
  IPermissionScopeResolution,
  sendTRPCMessage,
} from 'erxes-api-shared/utils';
import { CMS_POST_ACTIONS, permissions } from '~/meta/permissions';
import type { IContext } from '~/connectionResolvers';

type CmsContext = Pick<IContext, 'user' | 'models' | 'subdomain'>;

type TranslationInput = {
  language?: string;
};

type CmsReadAccess = {
  language?: string;
  translationLanguage?: string;
  query: Record<string, unknown>;
};

const COMMON_LANGUAGE_ACTIONS: Record<string, string> = {
  [CMS_POST_ACTIONS.languageMn]: 'mn',
  [CMS_POST_ACTIONS.languageEn]: 'en',
};

const CMS_POST_MODULE = 'cmsPost';

const OWNER_SCOPE: IPermissionScopeResolution = {
  all: true,
  userIds: [],
  entityIds: [],
};

const scopeCache = new WeakMap<
  CmsContext,
  Map<string, Promise<IPermissionScopeResolution | null>>
>();

const normalizeLanguage = (language?: string | null) =>
  language ? language.trim().toLowerCase() : '';

const toLanguageActionSuffix = (language: string) =>
  language
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('');

const canCms = (context: CmsContext, action: string) =>
  canGroup(context.subdomain, action, context.user);

const resolveCmsScope = (
  context: CmsContext,
  userId: string,
  actions: string[],
) => {
  const cache = scopeCache.get(context) || new Map();
  const key = [...actions].sort((a, b) => a.localeCompare(b)).join(',');
  let pending = cache.get(key);

  if (!pending) {
    pending = sendTRPCMessage({
      subdomain: context.subdomain,
      pluginName: 'core',
      method: 'query',
      module: 'permissions',
      action: 'resolveScope',
      input: {
        userId,
        plugin: permissions.plugin,
        module: CMS_POST_MODULE,
        actions,
      },
      defaultValue: null,
    });
    cache.set(key, pending);
    scopeCache.set(context, cache);
  }

  return pending;
};

export const getCmsPermissionScope = async (
  context: CmsContext,
  actions: string | string[],
): Promise<IPermissionScopeResolution | null> => {
  const { user, subdomain } = context;

  if (!user?._id) {
    throw new Error('Login required');
  }

  if (user.isOwner) {
    return OWNER_SCOPE;
  }

  const actionList = Array.isArray(actions) ? actions : [actions];
  const actionsMap = await getGroupActionsMap(subdomain, user);
  const granted = actionList.filter((action) => actionsMap[action]);

  if (!granted.length) {
    return null;
  }

  return resolveCmsScope(context, user._id, granted);
};

export const hasCmsPermission = async (
  context: CmsContext,
  actions: string | string[],
) => {
  return Boolean(await getCmsPermissionScope(context, actions));
};

export const requireCmsPermission = async (
  context: CmsContext,
  actions: string | string[],
) => {
  const scope = await getCmsPermissionScope(context, actions);

  if (scope) {
    return scope;
  }

  throw new Error('Permission required');
};

export const getCmsScopeQuery = async (
  context: CmsContext,
  actions: string | string[],
): Promise<Record<string, unknown>> => {
  const scope = await requireCmsPermission(context, actions);

  if (scope.all) {
    return {};
  }

  return { authorId: { $in: scope.userIds } };
};

export const assertCmsDocumentAccess = async ({
  context,
  actions,
  document,
}: {
  context: CmsContext;
  actions: string | string[];
  document?: { authorId?: string | null };
}) => {
  const scope = await requireCmsPermission(context, actions);

  if (scope.all) {
    return;
  }

  if (!document?.authorId || !scope.userIds.includes(document.authorId)) {
    throw new Error('Permission required');
  }
};

export const getAllowedCmsLanguages = async (context: CmsContext) => {
  const { user, subdomain } = context;

  if (!user?._id) {
    throw new Error('Login required');
  }

  if (user.isOwner || (await canCms(context, CMS_POST_ACTIONS.languageAll))) {
    return null;
  }

  const actionsMap = await getGroupActionsMap(subdomain, user);
  const languages = new Set<string>();

  for (const [action, language] of Object.entries(COMMON_LANGUAGE_ACTIONS)) {
    if (actionsMap[action]) {
      languages.add(language);
    }
  }

  for (const action of Object.keys(actionsMap)) {
    if (action.startsWith('cmsLanguage:')) {
      languages.add(normalizeLanguage(action.replace('cmsLanguage:', '')));
    }
  }

  return languages;
};

export const isCmsLanguageAllowed = async (
  context: CmsContext,
  language?: string | null,
) => {
  const normalized = normalizeLanguage(language);

  if (!normalized) {
    return true;
  }

  if (await canCms(context, CMS_POST_ACTIONS.languageAll)) {
    return true;
  }

  const actionSuffix = toLanguageActionSuffix(normalized);

  if (actionSuffix && (await canCms(context, `cmsLanguage${actionSuffix}`))) {
    return true;
  }

  return canCms(context, `cmsLanguage:${normalized}`);
};

const getDefaultLanguage = async (
  context: CmsContext,
  clientPortalId?: string,
) => {
  if (!clientPortalId) {
    return undefined;
  }

  const cms = await context.models.CMS.findOne({ clientPortalId })
    .select({ language: 1 })
    .lean();

  return cms?.language;
};

export const assertCmsLanguageAccess = async ({
  context,
  clientPortalId,
  language,
  translations,
}: {
  context: CmsContext;
  clientPortalId?: string;
  language?: string;
  translations?: TranslationInput[];
}) => {
  const languages = new Set<string>();

  if (language) {
    languages.add(normalizeLanguage(language));
  }

  for (const translation of translations || []) {
    if (translation?.language) {
      languages.add(normalizeLanguage(translation.language));
    }
  }

  if (languages.size === 0) {
    const defaultLanguage = await getDefaultLanguage(context, clientPortalId);
    if (defaultLanguage) {
      languages.add(normalizeLanguage(defaultLanguage));
    }
  }

  for (const item of languages) {
    if (!(await isCmsLanguageAllowed(context, item))) {
      throw new Error(`CMS language permission required: ${item}`);
    }
  }
};

export const applyCmsReadLanguageFilter = async (
  context: CmsContext,
  clientPortalId?: string,
  requestedLanguage?: string,
) => {
  return getCmsReadAccess(context, clientPortalId, requestedLanguage);
};

export const getCmsReadAccess = async (
  context: CmsContext,
  clientPortalId?: string,
  requestedLanguage?: string,
): Promise<CmsReadAccess> => {
  const query = await getCmsScopeQuery(context, CMS_POST_ACTIONS.read);

  if (requestedLanguage) {
    if (!clientPortalId) {
      throw new Error('clientPortalId is required when querying by language');
    }

    await assertCmsLanguageAccess({
      context,
      clientPortalId,
      language: requestedLanguage,
    });

    const defaultLanguage = await getDefaultLanguage(context, clientPortalId);
    const normalizedLanguage = normalizeLanguage(requestedLanguage);

    return {
      query,
      language: normalizedLanguage,
      translationLanguage:
        defaultLanguage &&
        normalizeLanguage(defaultLanguage) !== normalizedLanguage
          ? normalizedLanguage
          : undefined,
    };
  }

  const allowedLanguages = await getAllowedCmsLanguages(context);

  if (!allowedLanguages) {
    return { query };
  }

  if (allowedLanguages.size === 0) {
    throw new Error('CMS language permission required');
  }

  if (!clientPortalId) {
    throw new Error('clientPortalId is required for CMS language permissions');
  }

  if (allowedLanguages.size > 1) {
    throw new Error('CMS language is required');
  }
  const language = Array.from(allowedLanguages)[0];
  const defaultLanguage = await getDefaultLanguage(context, clientPortalId);

  return {
    query,
    language,
    translationLanguage:
      !defaultLanguage || normalizeLanguage(defaultLanguage) !== language
        ? language
        : undefined,
  };
};
