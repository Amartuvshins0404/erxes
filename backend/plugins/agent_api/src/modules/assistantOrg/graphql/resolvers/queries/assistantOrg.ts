import { IContext } from '~/connectionResolvers';
import {
  assertIdentifierAccess,
  buildIdentifierAccessQuery,
} from '~/modules/assistantOrg/permissions';
import { ensureLegacyIdentifierLinks } from '../../../utils';

const getIdentifiers = async (
  _root: undefined,
  { kind }: { kind?: string },
  { models, user }: IContext,
) => {
  await ensureLegacyIdentifierLinks(models);

  const identifiers = await models.Identifier.find(
    buildIdentifierAccessQuery(user),
  )
    .sort({ createdAt: 1 })
    .lean();

  if (!kind) {
    return identifiers;
  }

  const [agentIdentifierIds, opencodeIdentifierIds] = await Promise.all([
    models.AgentServer.distinct('identifierId', {}),
    models.OpencodeServer.distinct('identifierId', {}),
  ]);

  const agentIdentifierIdSet = new Set(agentIdentifierIds.map(String));
  const opencodeIdentifierIdSet = new Set(opencodeIdentifierIds.map(String));

  return identifiers.filter((identifier) => {
    const identifierId = String(identifier._id);

    if (kind === 'assistant') {
      return (
        identifier.kind === 'assistant' || agentIdentifierIdSet.has(identifierId)
      );
    }

    if (kind === 'agent') {
      return (
        identifier.kind === 'agent' ||
        opencodeIdentifierIdSet.has(identifierId)
      );
    }

    return true;
  });
};

const getIdentifier = async (
  _root: undefined,
  { identifierId }: { identifierId: string },
  { models, user }: IContext,
) => {
  await ensureLegacyIdentifierLinks(models);

  return assertIdentifierAccess(models, identifierId, user);
};

export const identifierQueries = {
  getIdentifiers,
  getIdentifier,
};
