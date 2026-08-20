import { IBlockAdminAgent } from '@/member/@types/member';
import { Router } from 'express';
import { IContext } from '~/connectionResolvers';
import { IResponse } from '~/types';

const router: Router = Router();

/**
 * Agency-side member snapshot as `blockagency_api` sends it. `_id` is the
 * agency-side member id and becomes `entityId` here.
 */
interface ISyncedMember extends Partial<IBlockAdminAgent> {
  _id: string;
}

interface IMemberWebhookRequest {
  body: {
    subdomain: string;
    payload: {
      entityId?: string;
      data: {
        _id?: string;
        members?: ISyncedMember[];
        member?: ISyncedMember;
        input?: Partial<IBlockAdminAgent>;
      };
    };
  };
}

/**
 * Only the fields block admin mirrors are taken off the payload; the tenant
 * keys are set from the webhook envelope instead.
 */
const toAgentInput = (member: ISyncedMember): Partial<IBlockAdminAgent> => ({
  agencyId: member.agencyId,
  memberId: member.memberId,
  role: member.role,
  description: member.description,
  country: member.country,
  city: member.city,
  district: member.district,
  facebookUrl: member.facebookUrl,
  instagramUrl: member.instagramUrl,
  linkedUrl: member.linkedUrl,
  certificatePhotos: member.certificatePhotos,
  user: member.user,
});

router.post(
  '/blockAgentCreateMember',
  async (req: IMemberWebhookRequest, res: IResponse) => {
    const { models } = res.locals as IContext;

    try {
      const { subdomain, payload } = req.body || {};

      const { members = [] } = payload?.data || {};

      await Promise.all(
        members.map((member) =>
          models.AgencyMember.saveAgent(
            subdomain,
            member._id,
            toAgentInput(member),
          ),
        ),
      );

      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  },
);

const updateMember = async (req: IMemberWebhookRequest, res: IResponse) => {
  const { models } = res.locals as IContext;

  try {
    const { subdomain, payload } = req.body || {};

    const { member, input } = payload?.data || {};

    const entityId = member?._id || payload?.entityId;

    if (!entityId) {
      return res.status(400).json({ error: 'Member id is required' });
    }

    await models.AgencyMember.saveAgent(subdomain, entityId, {
      ...(input || {}),
      ...(member ? toAgentInput(member) : {}),
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

router.post('/blockAgentUpdateMember', updateMember);
router.post('/blockAgentUpdateMemberProfile', updateMember);

router.post(
  '/blockAgentRemoveMember',
  async (req: IMemberWebhookRequest, res: IResponse) => {
    const { models } = res.locals as IContext;

    try {
      const { subdomain, payload } = req.body || {};

      const entityId = payload?.entityId || payload?.data?._id;

      if (!entityId) {
        return res.status(400).json({ error: 'Member id is required' });
      }

      await models.AgencyMember.removeAgent(subdomain, entityId);

      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  },
);

export { router };
