import { checkLogin } from 'erxes-api-shared/core-modules';
import { IContext } from '~/connectionResolvers';
import { BlockUnitStatus } from '~/modules/unit-assignment/db/unitAssignment';

type UnitQueryParams = {
  agencyId?: string;
  projectId?: string;
  memberId?: string;
  status?: BlockUnitStatus;
  page?: number;
  perPage?: number;
};

const buildFilter = ({
  agencyId,
  projectId,
  memberId,
  status,
}: Pick<UnitQueryParams, 'agencyId' | 'projectId' | 'memberId' | 'status'>) => {
  const filter: Record<string, any> = {};
  if (agencyId) filter.agencyId = agencyId;
  if (projectId) filter.projectId = projectId;
  if (memberId) filter.memberId = memberId;
  if (status) {
    filter.status =
      status === 'vacant' ? { $in: ['vacant', null, undefined] } : status;
  }
  return filter;
};

export const blockUnitQueries = {
  blockAgencyGetUnits: async (
    _root: undefined,
    {
      agencyId,
      projectId,
      memberId,
      status,
      page = 1,
      perPage = 20,
    }: UnitQueryParams,
    { models, user }: IContext,
  ) => {
    checkLogin(user);

    return models.BlockUnitAssignment.find(
      buildFilter({ agencyId, projectId, memberId, status }),
    )
      .sort({ assignedAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage)
      .lean();
  },

  blockAgencyGetUnitsTotalCount: async (
    _root: undefined,
    {
      agencyId,
      projectId,
      memberId,
      status,
    }: Pick<UnitQueryParams, 'agencyId' | 'projectId' | 'memberId' | 'status'>,
    { models, user }: IContext,
  ) => {
    checkLogin(user);

    return models.BlockUnitAssignment.countDocuments(
      buildFilter({ agencyId, projectId, memberId, status }),
    );
  },

  blockAgencyGetUnitStatusCounts: async (
    _root: undefined,
    { agencyId, projectId }: Pick<UnitQueryParams, 'agencyId' | 'projectId'>,
    { models, user }: IContext,
  ) => {
    checkLogin(user);

    const base = buildFilter({ agencyId, projectId });
    const [reserved, leased, sold, total] = await Promise.all([
      models.BlockUnitAssignment.countDocuments({
        ...base,
        status: 'reserved',
      }),
      models.BlockUnitAssignment.countDocuments({ ...base, status: 'leased' }),
      models.BlockUnitAssignment.countDocuments({ ...base, status: 'sold' }),
      models.BlockUnitAssignment.countDocuments(base),
    ]);
    const available = total - reserved - leased - sold;
    return { available, reserved, leased, sold };
  },
};
