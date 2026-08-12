import assert from 'node:assert/strict';
import test from 'node:test';

import type { ISaasOrganizationPlanHistory } from 'erxes-api-shared/utils';
import { computeActivePlanLimit } from './assistantLimits';

const activeHistory = (
  overrides: Partial<ISaasOrganizationPlanHistory>,
): ISaasOrganizationPlanHistory => ({
  organizationId: 'organization-1',
  status: 'active',
  startsAt: new Date('2026-01-01T00:00:00.000Z'),
  endsAt: new Date('9999-12-31T00:00:00.000Z'),
  ...overrides,
});

test('counts duplicate histories for one Stripe subscription once', () => {
  const histories = [
    activeHistory({
      source: 'onboarding',
      stripeSubscriptionId: 'subscription-1',
      assistantLimit: 3,
    }),
    activeHistory({
      source: 'manual',
      stripeSubscriptionId: 'subscription-1',
      assistantLimit: 3,
    }),
  ];

  assert.equal(computeActivePlanLimit(histories), 3);
});

test('continues to add coverage from distinct Stripe subscriptions', () => {
  const histories = [
    activeHistory({
      stripeSubscriptionId: 'subscription-1',
      assistantLimit: 3,
    }),
    activeHistory({
      stripeSubscriptionId: 'subscription-2',
      assistantLimit: 3,
    }),
  ];

  assert.equal(computeActivePlanLimit(histories), 6);
});

test('Business School 3 People overrides a stale six-assistant snapshot', () => {
  const histories = [
    activeHistory({
      source: 'onboarding',
      stripeSubscriptionId: 'subscription-1',
      bundle: { title: 'Business School 3 People' },
      pluginsLimitsSnapshot: { 'ai-assistant': { limit: 6 } },
    }),
  ];

  assert.equal(computeActivePlanLimit(histories), 3);
});
