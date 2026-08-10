import { Resolver } from 'erxes-api-shared/core-types';
import { cursorPaginate, markResolvers } from 'erxes-api-shared/utils';
import { IContext } from '~/connectionResolvers';
import { mapRegistrationApplicationGql } from '@/registration/utils/mapRegistrationApplicationGql';
import { assertClientPortalUser } from '@/registration/graphql/utils/registrationAuth';
import {
  buildRegistrationApplicationsFilter,
  IRegistrationApplicationsFilterParams,
} from '@/registration/utils/buildRegistrationApplicationsFilter';
import { exportRegistrationApplicationsCsv } from '@/registration/utils/exportRegistrationApplicationsCsv';

export type IRegistrationApplicationsQueryParams =
  IRegistrationApplicationsFilterParams;

export const registrationApplicationsQueries: Record<string, Resolver> = {
  async mtoRegistrationApplications(
    _root: undefined,
    params: IRegistrationApplicationsQueryParams,
    context: IContext,
  ) {
    const { models, subdomain, instanceId, cpUser } = context;

    const filter = buildRegistrationApplicationsFilter(
      params,
      subdomain,
      instanceId,
      cpUser,
    );

    const result = await cursorPaginate({
      model: models.RegistrationApplication,
      params: {
        ...params,
        orderBy: { createdAt: -1 },
      },
      query: filter,
    });

    const list = await Promise.all(
      result.list.map(
        (doc) =>
          mapRegistrationApplicationGql(
            models,
            doc as unknown as Record<string, unknown>,
          ) as Promise<Record<string, unknown>>,
      ),
    );

    return {
      ...result,
      list,
    };
  },

  async cpMtoRegistrationApplications(
    _root: undefined,
    params: Omit<IRegistrationApplicationsQueryParams, 'cpUserId'>,
    context: IContext,
  ) {
    assertClientPortalUser(context);

    const { models, subdomain, instanceId, cpUser } = context;
    const filter = buildRegistrationApplicationsFilter(
      params,
      subdomain,
      instanceId,
      cpUser,
    );

    const result = await cursorPaginate({
      model: models.RegistrationApplication,
      params: {
        ...params,
        orderBy: { createdAt: -1 },
      },
      query: filter,
    });

    const list = await Promise.all(
      result.list.map(
        (doc) =>
          mapRegistrationApplicationGql(
            models,
            doc as unknown as Record<string, unknown>,
          ) as Promise<Record<string, unknown>>,
      ),
    );

    return {
      ...result,
      list,
    };
  },

  async mtoRegistrationApplicationsCount(
    _root: undefined,
    params: IRegistrationApplicationsFilterParams,
    context: IContext,
  ) {
    const { models, subdomain, instanceId, cpUser } = context;

    const filter = buildRegistrationApplicationsFilter(
      params,
      subdomain,
      instanceId,
      cpUser,
    );

    return models.RegistrationApplication.countDocuments(filter);
  },

  async cpMtoRegistrationApplicationsCount(
    _root: undefined,
    params: Pick<
      IRegistrationApplicationsFilterParams,
      'membershipTypeId' | 'status'
    >,
    context: IContext,
  ) {
    assertClientPortalUser(context);

    const { models, subdomain, instanceId, cpUser } = context;

    const filter = buildRegistrationApplicationsFilter(
      params,
      subdomain,
      instanceId,
      cpUser,
    );

    return models.RegistrationApplication.countDocuments(filter);
  },

  async mtoRegistrationApplicationsExport(
    _root: undefined,
    params: IRegistrationApplicationsFilterParams,
    context: IContext,
  ) {
    if (context.cpUser) {
      throw new Error('Forbidden');
    }

    const { models, subdomain, instanceId } = context;

    const filter = buildRegistrationApplicationsFilter(
      params,
      subdomain,
      instanceId,
    );

    return exportRegistrationApplicationsCsv(models, filter);
  },

  async mtoRegistrationApplication(
    _root: undefined,
    { _id }: { _id: string },
    context: IContext,
  ) {
    const { models, subdomain, instanceId, cpUser } = context;

    const doc = await models.RegistrationApplication.findOne({
      _id,
      subdomain,
    }).lean();

    if (!doc) {
      return null;
    }

    if (instanceId && doc.instanceId && doc.instanceId !== instanceId) {
      return null;
    }

    if (cpUser?._id) {
      const ownerId = doc.cpUserId ? String(doc.cpUserId) : undefined;
      if (!ownerId || ownerId !== String(cpUser._id)) {
        return null;
      }
    }

    return mapRegistrationApplicationGql(
      models,
      doc as Record<string, unknown>,
    );
  },

  async cpMtoRegistrationApplication(
    _root: undefined,
    { _id }: { _id: string },
    context: IContext,
  ) {
    assertClientPortalUser(context);

    const { models, subdomain, instanceId, cpUser } = context;

    const doc = await models.RegistrationApplication.findOne({
      _id,
      subdomain,
    }).lean();

    if (!doc) {
      return null;
    }

    if (instanceId && doc.instanceId && doc.instanceId !== instanceId) {
      return null;
    }

    if (cpUser?._id) {
      const ownerId = doc.cpUserId ? String(doc.cpUserId) : undefined;
      if (!ownerId || ownerId !== String(cpUser._id)) {
        return null;
      }
    }

    return mapRegistrationApplicationGql(
      models,
      doc as Record<string, unknown>,
    );
  },
};

markResolvers(registrationApplicationsQueries, {
  wrapperConfig: {
    skipPermission: true,
  },
});
