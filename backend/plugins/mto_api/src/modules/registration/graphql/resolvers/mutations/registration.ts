import { Resolver } from 'erxes-api-shared/core-types';
import { markResolvers } from 'erxes-api-shared/utils';
import { IContext } from '~/connectionResolvers';
import {
  assertClientPortalAllowedStatusUpdate,
  assertClientPortalUser,
} from '@/registration/graphql/utils/registrationAuth';
import {
  assertApplicationInstanceMatches,
  assertCpUserOwnsApplication,
  loadRegistrationDefinitionOrThrow,
  normalizeAnswersRecord,
  parseNextStatusOrThrow,
  resolveStaffCpLinkPatches,
  toPlainRegistrationDoc,
  validateAnswersOrThrow,
} from '@/registration/graphql/utils/registrationApplicationMutations';
import { mapRegistrationApplicationGql } from '@/registration/utils/mapRegistrationApplicationGql';
import {
  getRegistrationPaymentUrl,
  maybeCreateRegistrationInvoiceOnApproval,
} from '@/registration/utils/registrationPayment';
import { getRegistrationFormDefinition } from '@/registration/schemas/registry';

interface SubmitArgs {
  membershipTypeId: string;
  schemaVersion: string;
  answers: Record<string, unknown>;
  cpUserId?: string | null;
}

interface UpdateApplicationArgs {
  _id: string;
  answers?: Record<string, unknown> | null;
  status?: string | null;
  cpUserId?: string | null;
}

interface MarkReadArgs {
  _id: string;
  isRead?: boolean | null;
}

interface ApplicationIdArgs {
  _id: string;
}

async function resolveMembershipTypeTitle(
  models: IContext['models'],
  membershipTypeId: string,
  schemaVersion: string,
): Promise<string> {
  const def = await getRegistrationFormDefinition(
    models,
    membershipTypeId,
    schemaVersion,
  );
  return def?.title ?? membershipTypeId;
}

async function finalizeStaffApplicationUpdate(
  existing: { status?: string; membershipTypeId: string; schemaVersion: string },
  updated: NonNullable<
    Awaited<
      ReturnType<IContext['models']['RegistrationApplication']['updateApplicationById']>
    >
  >,
  context: IContext,
) {
  const { models } = context;
  const membershipTypeTitle = await resolveMembershipTypeTitle(
    models,
    updated.membershipTypeId,
    updated.schemaVersion,
  );

  const withInvoice = await maybeCreateRegistrationInvoiceOnApproval(
    existing.status,
    updated,
    context,
    membershipTypeTitle,
  );

  return mapRegistrationApplicationGql(
    models,
    toPlainRegistrationDoc(withInvoice),
  );
}

function resolveSubmitCpUserId(
  context: IContext,
  cpUserIdArg?: string | null,
): string | undefined {
  if (context.cpUser?._id !== undefined && context.cpUser?._id !== null)
    return String(context.cpUser._id);

  if (
    cpUserIdArg !== undefined &&
    cpUserIdArg !== null &&
    String(cpUserIdArg).trim() !== ''
  )
    return String(cpUserIdArg).trim();

  return undefined;
}

function parseAndValidateAnswers(
  definition: Parameters<typeof validateAnswersOrThrow>[0],
  answers: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  const parsed = normalizeAnswersRecord(answers);
  validateAnswersOrThrow(definition, parsed);
  return parsed;
}

export const registrationMutations: Record<string, Resolver> = {
  async mtoRegistrationSubmit(
    _root: undefined,
    {
      membershipTypeId,
      schemaVersion,
      answers,
      cpUserId: cpUserIdArg,
    }: SubmitArgs,
    context: IContext,
  ) {
    const { models, subdomain, instanceId } = context;

    const resolvedDefinition = await loadRegistrationDefinitionOrThrow(
      models,
      membershipTypeId,
      schemaVersion,
    );

    const parsed = parseAndValidateAnswers(resolvedDefinition, answers);
    const resolvedCpUserId = resolveSubmitCpUserId(context, cpUserIdArg);

    const created = await models.RegistrationApplication.createApplication({
      membershipTypeId,
      schemaVersion,
      status: 'submitted',
      answers: parsed,
      subdomain,
      instanceId,
      ...(resolvedCpUserId ? { cpUserId: resolvedCpUserId } : {}),
    });
    return mapRegistrationApplicationGql(
      models,
      toPlainRegistrationDoc(created),
    );
  },

  async cpMtoRegistrationSubmit(
    _root: undefined,
    { membershipTypeId, schemaVersion, answers }: Omit<SubmitArgs, 'cpUserId'>,
    context: IContext,
  ) {
    assertClientPortalUser(context);

    const { models, subdomain, instanceId } = context;

    const resolvedDefinition = await loadRegistrationDefinitionOrThrow(
      models,
      membershipTypeId,
      schemaVersion,
    );

    const parsed = parseAndValidateAnswers(resolvedDefinition, answers);
    const resolvedCpUserId = resolveSubmitCpUserId(context);

    const created = await models.RegistrationApplication.createApplication({
      membershipTypeId,
      schemaVersion,
      status: 'submitted',
      answers: parsed,
      subdomain,
      instanceId,
      ...(resolvedCpUserId ? { cpUserId: resolvedCpUserId } : {}),
    });
    return mapRegistrationApplicationGql(
      models,
      toPlainRegistrationDoc(created),
    );
  },

  async mtoRegistrationApplicationUpdate(
    _root: undefined,
    { _id, answers, status, cpUserId: cpUserIdArg }: UpdateApplicationArgs,
    context: IContext,
  ) {
    const { models, subdomain, instanceId } = context;

    const existing = await models.RegistrationApplication.findOne({
      _id,
      subdomain,
    }).lean();

    if (!existing) {
      throw new Error('Application not found');
    }

    assertApplicationInstanceMatches(existing, instanceId);
    assertCpUserOwnsApplication(context.cpUser, existing);

    const resolvedDefinition = await loadRegistrationDefinitionOrThrow(
      models,
      existing.membershipTypeId,
      existing.schemaVersion,
    );

    const parsedAnswers =
      answers !== undefined && answers !== null
        ? parseAndValidateAnswers(resolvedDefinition, answers)
        : undefined;

    const nextStatus = parseNextStatusOrThrow(status);
    assertClientPortalAllowedStatusUpdate(context, nextStatus);

    const { cpUserIdPatch } = context.cpUser
      ? {}
      : resolveStaffCpLinkPatches({
          cpUserId: cpUserIdArg,
        });

    if (
      parsedAnswers === undefined &&
      nextStatus === undefined &&
      cpUserIdPatch === undefined
    ) {
      throw new Error('Nothing to update');
    }

    const updated = await models.RegistrationApplication.updateApplicationById(
      _id,
      subdomain,
      {
        ...(parsedAnswers !== undefined ? { answers: parsedAnswers } : {}),
        ...(nextStatus !== undefined ? { status: nextStatus } : {}),
        ...(cpUserIdPatch !== undefined ? { cpUserId: cpUserIdPatch } : {}),
      },
    );

    if (!updated) {
      throw new Error('Application not found');
    }

    return finalizeStaffApplicationUpdate(existing, updated, context);
  },

  async cpMtoRegistrationApplicationUpdate(
    _root: undefined,
    { _id, answers, status }: Omit<UpdateApplicationArgs, 'cpUserId'>,
    context: IContext,
  ) {
    assertClientPortalUser(context);

    const { models, subdomain, instanceId } = context;

    const existing = await models.RegistrationApplication.findOne({
      _id,
      subdomain,
    }).lean();

    if (!existing) {
      throw new Error('Application not found');
    }

    assertApplicationInstanceMatches(existing, instanceId);
    assertCpUserOwnsApplication(context.cpUser, existing);

    const resolvedDefinition = await loadRegistrationDefinitionOrThrow(
      models,
      existing.membershipTypeId,
      existing.schemaVersion,
    );

    const parsedAnswers =
      answers !== undefined && answers !== null
        ? parseAndValidateAnswers(resolvedDefinition, answers)
        : undefined;

    const nextStatus = parseNextStatusOrThrow(status);
    assertClientPortalAllowedStatusUpdate(context, nextStatus);

    if (parsedAnswers === undefined && nextStatus === undefined) {
      throw new Error('Nothing to update');
    }

    const updated = await models.RegistrationApplication.updateApplicationById(
      _id,
      subdomain,
      {
        ...(parsedAnswers !== undefined ? { answers: parsedAnswers } : {}),
        ...(nextStatus !== undefined ? { status: nextStatus } : {}),
      },
    );

    if (!updated) {
      throw new Error('Application not found');
    }

    return mapRegistrationApplicationGql(
      models,
      toPlainRegistrationDoc(updated),
    );
  },

  async mtoRegistrationApplicationMarkRead(
    _root: undefined,
    { _id, isRead }: MarkReadArgs,
    context: IContext,
  ) {
    const { models, subdomain } = context;

    const updated = await models.RegistrationApplication.markAsRead(
      _id,
      subdomain,
      isRead !== false,
    );

    if (!updated) {
      throw new Error('Application not found');
    }

    return mapRegistrationApplicationGql(models, toPlainRegistrationDoc(updated));
  },

  async mtoRegistrationApplicationVerifyManualPayment(
    _root: undefined,
    { _id }: ApplicationIdArgs,
    context: IContext,
  ) {
    if (context.cpUser) {
      throw new Error('Forbidden');
    }

    const { models, subdomain } = context;

    const existing = await models.RegistrationApplication.findOne({
      _id,
      subdomain,
    }).lean();

    if (!existing) {
      throw new Error('Application not found');
    }

    const updated = await models.RegistrationApplication.updateApplicationById(
      _id,
      subdomain,
      { paymentStatus: 'manual_verified' },
    );

    if (!updated) {
      throw new Error('Application not found');
    }

    return mapRegistrationApplicationGql(
      models,
      toPlainRegistrationDoc(updated),
    );
  },

  async mtoRegistrationApplicationPaymentUrl(
    _root: undefined,
    { _id }: ApplicationIdArgs,
    context: IContext,
  ) {
    if (context.cpUser) {
      throw new Error('Forbidden');
    }

    const { models, subdomain } = context;

    const existing = await models.RegistrationApplication.findOne({
      _id,
      subdomain,
    }).lean();

    if (!existing) {
      throw new Error('Application not found');
    }

    if (!existing.invoiceId) {
      throw new Error('No payment invoice exists for this application.');
    }

    return getRegistrationPaymentUrl(existing.invoiceId, subdomain);
  },
};

markResolvers(registrationMutations, {
  wrapperConfig: {
    skipPermission: true,
  },
});
