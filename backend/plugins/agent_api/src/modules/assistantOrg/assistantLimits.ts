import { IContext } from '~/connectionResolvers';
import { buildIdentifierAccessQuery } from '~/modules/assistantOrg/permissions';
import {
  getSaasOrganizationActiveAddons,
  getSaasOrganizationDetail,
  getSaasOrganizationPlanHistories,
} from 'erxes-api-shared/utils';
import type {
  IOrganization,
  ISaasAddon,
  ISaasOrganizationPlanHistory,
} from 'erxes-api-shared/utils';
import type { IIdentifierDocument } from './@types/assistantOrg';

export interface AssistantLimit {
  limited: boolean;
  allowed: boolean;
  limit?: number;
  used: number;
  remaining?: number;
  hasActivePlan: boolean;
  source: string;
  upgradeUrl?: string;
  billingWarning?: AssistantBillingWarning | null;
  billingOverview?: AssistantBillingOverview | null;
}

export interface AssistantBillingWarning {
  active: boolean;
  deletionDue: boolean;
  gracePeriodDays: number;
  daysUntilDeletion: number;
  unpaidSince?: string;
  deletionDate?: string;
  message: string;
}

export interface AssistantBillingItem {
  identifierId: string;
  name: string;
  slug: string;
  description?: string | null;
  memberIds: string[];
  createdAt?: string;
  updatedAt?: string;
  planStartDate?: string | null;
  planEndDate?: string | null;
  paymentStatus: 'paid' | 'unpaid';
  blocked: boolean;
  planActive: boolean;
  overdueDays: number;
  message: string;
}

export interface AssistantBillingOverview {
  active: boolean;
  blocked: boolean;
  overdueCount: number;
  billingUrl?: string;
  message: string;
  items: AssistantBillingItem[];
}

const ACTIVE_HISTORY_STATUSES = ['active'];
export const ASSISTANT_PAYMENT_GRACE_PERIOD_DAYS = 21;
const SAAS_HOST_SUFFIX = '.next.erxes.io';
const ENTERPRISE_HOST_SUFFIX = '.erxes.io';

const ASSISTANT_LIMIT_KEY_MATCHERS = [
  'ai:assistant',
  'assistant',
  'aiassistant',
  'ai-assistant',
  'agent-assistant',
  'openclaw',
];

const normalizeText = (value?: string) =>
  (value || '').trim().toLowerCase().replace(/\s+/g, ' ');

const normalizeKey = (value: string) =>
  normalizeText(value).replace(/[\s_]+/g, '-');

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readLimitNumber = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.floor(value));
  }

  if (!isRecord(value)) {
    return 0;
  }

  const limit = value.limit;

  return typeof limit === 'number' && Number.isFinite(limit)
    ? Math.max(0, Math.floor(limit))
    : 0;
};

const getBusinessSchoolAssistantLimitFromDescriptor = (descriptor: string) => {
  if (
    descriptor.includes('business school') &&
    descriptor.includes('25 people')
  ) {
    return 25;
  }

  if (
    descriptor.includes('business school') &&
    descriptor.includes('10 people')
  ) {
    return 10;
  }

  if (
    descriptor.includes('business school') &&
    descriptor.includes('3 people')
  ) {
    return 3;
  }

  return 0;
};

const isAssistantLimitKey = (key: string) => {
  const normalized = normalizeKey(key);

  return ASSISTANT_LIMIT_KEY_MATCHERS.some((matcher) =>
    normalized.includes(matcher),
  );
};

const getSnapshotAssistantLimit = (
  snapshot?: Record<string, unknown>,
): number => {
  if (!snapshot) {
    return 0;
  }

  return Object.entries(snapshot).reduce((sum, [key, value]) => {
    if (!isAssistantLimitKey(key)) {
      return sum;
    }

    return sum + readLimitNumber(value);
  }, 0);
};

const getFallbackBundleAssistantLimit = (
  history: ISaasOrganizationPlanHistory,
) => {
  return getFallbackAssistantLimitFromDescriptor(
    `${history.bundle?.title || ''} ${history.bundle?.type || ''}`,
  );
};

const getFallbackAssistantLimitFromDescriptor = (value: string) => {
  const descriptor = normalizeText(value);

  if (!descriptor.includes('assistant') && !descriptor.includes('ai')) {
    return 0;
  }

  const businessSchoolLimit =
    getBusinessSchoolAssistantLimitFromDescriptor(descriptor);

  if (businessSchoolLimit > 0) {
    return businessSchoolLimit;
  }

  if (descriptor.includes('gold')) {
    return 3;
  }

  if (descriptor.includes('silver')) {
    return 2;
  }

  if (descriptor.includes('bronze')) {
    return 1;
  }

  return 0;
};

const getActiveAddonAssistantLimit = (addon: ISaasAddon): number => {
  const descriptor = normalizeText(
    `${addon.kind || ''} ${addon.bundle?.title || ''} ${
      addon.bundle?.type || ''
    }`,
  );
  const businessSchoolLimit =
    getBusinessSchoolAssistantLimitFromDescriptor(descriptor);
  const snapshotLimit = getSnapshotAssistantLimit(addon.bundle?.pluginsLimits);

  const fallbackLimit = getFallbackAssistantLimitFromDescriptor(descriptor);
  const baseLimit = businessSchoolLimit || snapshotLimit || fallbackLimit;
  const quantity =
    typeof addon.quantity === 'number' && Number.isFinite(addon.quantity)
      ? Math.max(0, Math.floor(addon.quantity))
      : 1;

  return baseLimit * quantity;
};

const isHistoryCurrent = (history: ISaasOrganizationPlanHistory) => {
  const now = Date.now();
  const startsAt = history.startsAt ? new Date(history.startsAt).getTime() : 0;
  const endsAt = history.endsAt
    ? new Date(history.endsAt).getTime()
    : Number.POSITIVE_INFINITY;

  return startsAt <= now && endsAt >= now;
};

const getHistoryAssistantLimit = (
  history: ISaasOrganizationPlanHistory,
): number => {
  const bundleDescriptor = normalizeText(
    `${history.bundle?.title || ''} ${history.bundle?.type || ''}`,
  );
  const businessSchoolLimit =
    normalizeText(history.source) === 'gift'
      ? 0
      : getBusinessSchoolAssistantLimitFromDescriptor(bundleDescriptor);

  if (businessSchoolLimit > 0) {
    return businessSchoolLimit;
  }

  // Admin-gifted dynamic assistant count takes precedence over everything else.
  if (
    typeof history.assistantLimit === 'number' &&
    Number.isFinite(history.assistantLimit) &&
    history.assistantLimit > 0
  ) {
    return Math.max(0, Math.floor(history.assistantLimit));
  }

  const snapshotLimit = getSnapshotAssistantLimit(
    history.pluginsLimitsSnapshot,
  );

  if (snapshotLimit > 0) {
    return snapshotLimit;
  }

  return getFallbackBundleAssistantLimit(history);
};

const computeActivePlanLimit = (
  histories: ISaasOrganizationPlanHistory[],
): number => {
  const activeHistories = histories.filter(
    (history) =>
      ACTIVE_HISTORY_STATUSES.includes(history.status || '') &&
      isHistoryCurrent(history),
  );

  return activeHistories.reduce(
    (sum, history) => sum + getHistoryAssistantLimit(history),
    0,
  );
};

const getUncoveredAssistantAddons = (
  addons: ISaasAddon[],
  histories: ISaasOrganizationPlanHistory[],
) => {
  const activeHistorySubscriptionIds = new Set(
    histories
      .filter(
        (history) =>
          ACTIVE_HISTORY_STATUSES.includes(history.status || '') &&
          isHistoryCurrent(history),
      )
      .map((history) => history.stripeSubscriptionId)
      .filter(Boolean)
      .map(String),
  );

  return addons.filter((addon) => {
    if (getActiveAddonAssistantLimit(addon) <= 0) {
      return false;
    }

    return (
      !addon.subscriptionId ||
      !activeHistorySubscriptionIds.has(String(addon.subscriptionId))
    );
  });
};

const computeActiveCoverageLimit = ({
  histories,
  addons,
}: {
  histories: ISaasOrganizationPlanHistory[];
  addons: ISaasAddon[];
}) =>
  computeActivePlanLimit(histories) +
  getUncoveredAssistantAddons(addons, histories).reduce(
    (sum, addon) => sum + getActiveAddonAssistantLimit(addon),
    0,
  );

const isSaasOrganization = (organization: IOrganization) => {
  const domain = normalizeText(organization.domain);

  if (organization.isNext || domain.endsWith(SAAS_HOST_SUFFIX)) {
    return true;
  }

  if (
    domain.endsWith(ENTERPRISE_HOST_SUFFIX) &&
    !domain.endsWith(SAAS_HOST_SUFFIX)
  ) {
    return false;
  }

  return false;
};

const buildUpgradeUrl = () => 'https://erxes.io/organizations?bundleCode=ai';

const getUsedAssistantCount = async (models: IContext['models']) => {
  const [identifierCount, serverCount] = await Promise.all([
    models.Identifier.countDocuments({ kind: 'assistant' }),
    models.AgentServer.countDocuments({}),
  ]);

  return Math.max(identifierCount, serverCount);
};

const getHistoryTime = (
  history: ISaasOrganizationPlanHistory,
  field: 'startsAt' | 'endsAt' | 'updatedAt' | 'createdAt',
) => {
  const value = history[field];

  if (!value) {
    return 0;
  }

  const time = new Date(value).getTime();

  return Number.isFinite(time) ? time : 0;
};

const getBillingGraceStart = (
  history: ISaasOrganizationPlanHistory,
): Date | null => {
  const endedAt = getHistoryTime(history, 'endsAt');
  const updatedAt = getHistoryTime(history, 'updatedAt');
  const createdAt = getHistoryTime(history, 'createdAt');
  const now = Date.now();
  const graceStart =
    endedAt && endedAt <= now ? endedAt : updatedAt || createdAt;

  return graceStart ? new Date(graceStart) : null;
};

const getLatestAssistantHistory = (histories: ISaasOrganizationPlanHistory[]) =>
  histories
    .filter((history) => getHistoryAssistantLimit(history) > 0)
    .sort((left, right) => {
      const rightTime =
        getHistoryTime(right, 'endsAt') ||
        getHistoryTime(right, 'updatedAt') ||
        getHistoryTime(right, 'createdAt');
      const leftTime =
        getHistoryTime(left, 'endsAt') ||
        getHistoryTime(left, 'updatedAt') ||
        getHistoryTime(left, 'createdAt');

      return rightTime - leftTime;
    })[0];

// The plan window shown to the customer must reflect when the assistant
// capacity was actually granted. For admin-gifted limits that is the gift
// date (history.startsAt), NOT the org/SaaS creation date that a purchased or
// onboarding history might otherwise contribute. So prefer the most recent
// gift history; fall back to the generic latest-assistant history only when no
// gift exists (e.g. capacity purchased via a paid bundle).
const getAssistantPlanHistory = (
  histories: ISaasOrganizationPlanHistory[],
): ISaasOrganizationPlanHistory | undefined => {
  const activeHistories = histories.filter(
    (history) =>
      ACTIVE_HISTORY_STATUSES.includes(history.status || '') &&
      isHistoryCurrent(history) &&
      getHistoryAssistantLimit(history) > 0,
  );
  const giftHistory = activeHistories
    .filter((history) => normalizeText(history.source) === 'gift')
    .sort(
      (left, right) =>
        getHistoryTime(right, 'startsAt') - getHistoryTime(left, 'startsAt'),
    )[0];

  const latestActiveHistory = activeHistories.sort((left, right) => {
    const rightTime =
      getHistoryTime(right, 'endsAt') ||
      getHistoryTime(right, 'updatedAt') ||
      getHistoryTime(right, 'createdAt');
    const leftTime =
      getHistoryTime(left, 'endsAt') ||
      getHistoryTime(left, 'updatedAt') ||
      getHistoryTime(left, 'createdAt');

    return rightTime - leftTime;
  })[0];

  return (
    giftHistory || latestActiveHistory || getLatestAssistantHistory(histories)
  );
};

const getAssistantAddonPlanPeriod = (
  addons: ISaasAddon[],
  histories: ISaasOrganizationPlanHistory[],
) =>
  getUncoveredAssistantAddons(addons, histories)
    .filter((addon) => getActiveAddonAssistantLimit(addon) > 0)
    .sort((left, right) => {
      const rightTime = right.expiryDate
        ? new Date(right.expiryDate).getTime()
        : 0;
      const leftTime = left.expiryDate
        ? new Date(left.expiryDate).getTime()
        : 0;

      return rightTime - leftTime;
    })[0];

const getBillingNoticeMessage = (overdueDays: number) => {
  if (overdueDays >= 20) {
    return 'Access is blocked. You have to pay now to restore this assistant.';
  }

  if (overdueDays >= 18) {
    return 'Final warning. You have to pay to keep this assistant active.';
  }

  if (overdueDays >= 12) {
    return 'Your bill is overdue. You have to pay soon to keep access.';
  }

  if (overdueDays >= 6) {
    return 'Your payment is overdue. You have to pay to keep access.';
  }

  return 'You have to pay to open this assistant.';
};

const getBillingState = (history?: ISaasOrganizationPlanHistory | null) => {
  if (!history) {
    return {
      blocked: false,
      overdueDays: 0,
      paymentStatus: 'paid' as const,
      message: '',
    };
  }

  // A plan only counts as "paid/covered" while it is active AND within its
  // window — the exact same test computeActivePlanLimit uses to grant the
  // limit. Anything else (expired, canceled, or a past_due->failed sub whose
  // endsAt has not passed yet) is unpaid, so the overview must not report
  // "no outstanding payment" while getAssistantLimit already flags a warning.
  const isCovered =
    ACTIVE_HISTORY_STATUSES.includes(history.status || '') &&
    isHistoryCurrent(history);

  if (isCovered) {
    return {
      blocked: false,
      overdueDays: 0,
      paymentStatus: 'paid' as const,
      message: '',
    };
  }

  // Overdue is measured from when coverage actually lapsed (endsAt if it has
  // passed, otherwise the moment the plan went unpaid) rather than from endsAt
  // alone, so a failed sub with a still-future endsAt is treated as overdue.
  const graceStart = getBillingGraceStart(history);
  const overdueDays = graceStart
    ? Math.max(
        0,
        Math.ceil((Date.now() - graceStart.getTime()) / (24 * 60 * 60 * 1000)),
      )
    : 0;

  return {
    blocked: true,
    overdueDays,
    paymentStatus: 'unpaid' as const,
    message: getBillingNoticeMessage(overdueDays),
  };
};

export const getAssistantBillingWarning = ({
  histories,
  hasActivePlan,
  used,
}: {
  histories: ISaasOrganizationPlanHistory[];
  hasActivePlan: boolean;
  used: number;
}): AssistantBillingWarning | null => {
  if (hasActivePlan || used === 0) {
    return null;
  }

  const latestAssistantHistory = getLatestAssistantHistory(histories);

  if (!latestAssistantHistory) {
    return null;
  }

  const unpaidSince = getBillingGraceStart(latestAssistantHistory);

  if (!unpaidSince) {
    return null;
  }

  const gracePeriodMs =
    ASSISTANT_PAYMENT_GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000;
  const deletionDate = new Date(unpaidSince.getTime() + gracePeriodMs);
  const remainingMs = deletionDate.getTime() - Date.now();
  const deletionDue = remainingMs <= 0;
  const daysUntilDeletion = deletionDue
    ? 0
    : Math.max(1, Math.ceil(remainingMs / (24 * 60 * 60 * 1000)));

  return {
    active: true,
    deletionDue,
    gracePeriodDays: ASSISTANT_PAYMENT_GRACE_PERIOD_DAYS,
    daysUntilDeletion,
    unpaidSince: unpaidSince.toISOString(),
    deletionDate: deletionDate.toISOString(),
    message: deletionDue
      ? 'Your AI Assistant bundle payment is overdue. The OpenClaw server is scheduled for deletion.'
      : `Your AI Assistant bundle payment is overdue. The OpenClaw server will be deleted in ${daysUntilDeletion} day${
          daysUntilDeletion === 1 ? '' : 's'
        } unless payment is completed.`,
  };
};

export const getAssistantLimit = async ({
  models,
  subdomain,
}: {
  models: IContext['models'];
  subdomain: string;
}): Promise<AssistantLimit> => {
  const used = await getUsedAssistantCount(models);

  let organization: IOrganization;

  try {
    organization = await getSaasOrganizationDetail({
      subdomain,
    });
  } catch {
    return {
      limited: false,
      allowed: true,
      used,
      hasActivePlan: true,
      source: 'enterprise',
    };
  }

  if (!organization?._id || !isSaasOrganization(organization)) {
    return {
      limited: false,
      allowed: true,
      used,
      hasActivePlan: true,
      source: 'enterprise',
    };
  }

  const [histories, activeAddons] = await Promise.all([
    getSaasOrganizationPlanHistories({
      organizationId: organization._id,
      statuses: [],
    }),
    getSaasOrganizationActiveAddons({
      organizationId: organization._id,
    }),
  ]);

  const limit = computeActiveCoverageLimit({ histories, addons: activeAddons });
  const remaining = Math.max(0, limit - used);
  const hasActivePlan = limit > 0;

  return {
    limited: true,
    allowed: remaining > 0,
    limit,
    used,
    remaining,
    hasActivePlan,
    source: 'payment_history',
    upgradeUrl: buildUpgradeUrl(),
    billingWarning: getAssistantBillingWarning({
      histories,
      hasActivePlan,
      used,
    }),
  };
};

export const getAssistantBillingOverview = async ({
  models,
  subdomain,
  user,
}: {
  models: IContext['models'];
  subdomain: string;
  user?: IContext['user'];
}): Promise<AssistantBillingOverview> => {
  let organization: IOrganization;

  try {
    organization = await getSaasOrganizationDetail({
      subdomain,
    });
  } catch {
    return {
      active: false,
      blocked: false,
      overdueCount: 0,
      message: '',
      items: [],
    };
  }

  if (!organization?._id || !isSaasOrganization(organization)) {
    return {
      active: false,
      blocked: false,
      overdueCount: 0,
      message: '',
      items: [],
    };
  }

  const [histories, activeAddons] = await Promise.all([
    getSaasOrganizationPlanHistories({
      organizationId: organization._id,
      statuses: [],
    }),
    getSaasOrganizationActiveAddons({
      organizationId: organization._id,
    }),
  ]);
  const latestAssistantHistory = getLatestAssistantHistory(histories);
  const planHistory = getAssistantPlanHistory(histories);
  const addonPlanPeriod = getAssistantAddonPlanPeriod(activeAddons, histories);
  const limit = computeActiveCoverageLimit({ histories, addons: activeAddons });
  const billingState =
    limit > 0
      ? {
          blocked: false,
          overdueDays: 0,
          paymentStatus: 'paid' as const,
          message: '',
        }
      : getBillingState(latestAssistantHistory);
  const identifiers = (await models.Identifier.find(
    buildIdentifierAccessQuery(user),
    {
      name: 1,
      slug: 1,
      description: 1,
      memberIds: 1,
      createdAt: 1,
      updatedAt: 1,
      kind: 1,
      planActive: 1,
    },
  )
    .sort({ createdAt: 1 })
    .lean()) as IIdentifierDocument[];

  const assistants = identifiers.filter(
    (identifier) => identifier.kind === 'assistant',
  );

  // An assistant occupies a plan slot unless the user explicitly deselected it
  // (planActive === false). Among the candidates, the oldest `limit` keep their
  // slot; any extras are "over plan" and blocked until the user picks them or
  // upgrades.
  const slotCandidates = assistants.filter(
    (identifier) => identifier.planActive !== false,
  );
  const activeIdSet = new Set(
    slotCandidates.slice(0, Math.max(0, limit)).map((i) => String(i._id)),
  );

  const items = assistants.map((identifier) => {
    const identifierId = String(identifier._id);
    const planActive = activeIdSet.has(identifierId);
    const overPlan = !planActive && !billingState.blocked;
    const blocked = billingState.blocked || overPlan;

    let message = 'This assistant is active.';

    if (billingState.blocked) {
      message = billingState.message;
    } else if (overPlan) {
      message = `Not included in your current plan (${limit} assistant${
        limit === 1 ? '' : 's'
      }). Select it in billing or upgrade your plan.`;
    }

    return {
      identifierId,
      name: identifier.name,
      slug: identifier.slug,
      description: identifier.description || null,
      memberIds: identifier.memberIds || [],
      createdAt: identifier.createdAt?.toISOString?.() || undefined,
      updatedAt: identifier.updatedAt?.toISOString?.() || undefined,
      planStartDate: planHistory?.startsAt
        ? new Date(planHistory.startsAt).toISOString()
        : addonPlanPeriod?.createdAt
        ? new Date(addonPlanPeriod.createdAt).toISOString()
        : null,
      planEndDate: planHistory?.endsAt
        ? new Date(planHistory.endsAt).toISOString()
        : addonPlanPeriod?.expiryDate
        ? new Date(addonPlanPeriod.expiryDate).toISOString()
        : null,
      paymentStatus: billingState.paymentStatus,
      blocked,
      planActive,
      overdueDays: billingState.overdueDays,
      message,
    };
  });

  const blockedCount = items.filter((item) => item.blocked).length;

  return {
    active: items.length > 0,
    blocked: billingState.blocked,
    overdueCount: blockedCount,
    billingUrl: buildUpgradeUrl(),
    message: billingState.blocked
      ? billingState.message
      : 'No outstanding assistant payment was found.',
    items,
  };
};

export const setAssistantPlanSelection = async ({
  models,
  subdomain,
  user,
  identifierIds,
}: {
  models: IContext['models'];
  subdomain: string;
  user?: IContext['user'];
  identifierIds: string[];
}) => {
  const { limit } = await getAssistantLimit({ models, subdomain });
  const selected = Array.from(
    new Set((identifierIds || []).map((id) => id?.trim()).filter(Boolean)),
  );

  if (typeof limit === 'number' && selected.length > limit) {
    throw new Error(
      `You can keep at most ${limit} assistant${
        limit === 1 ? '' : 's'
      } active on the current plan.`,
    );
  }

  const accessQuery = buildIdentifierAccessQuery(user);
  const assistants = (await models.Identifier.find(
    { ...accessQuery, kind: 'assistant' },
    { _id: 1 },
  ).lean()) as IIdentifierDocument[];

  const selectedSet = new Set(selected);

  await Promise.all(
    assistants.map((assistant) =>
      models.Identifier.updateOne(
        { _id: assistant._id },
        { $set: { planActive: selectedSet.has(String(assistant._id)) } },
      ),
    ),
  );

  return true;
};

export const assertAssistantLimitAvailable = async ({
  models,
  subdomain,
}: {
  models: IContext['models'];
  subdomain: string;
}) => {
  const limit = await getAssistantLimit({ models, subdomain });

  if (!limit.limited || limit.allowed) {
    return limit;
  }

  if (!limit.hasActivePlan) {
    throw new Error(
      'An active AI Assistant bundle is required before creating an assistant.',
    );
  }

  throw new Error(
    `AI Assistant limit reached. You can create ${
      limit.limit || 0
    } assistant(s) on the active plan.`,
  );
};
