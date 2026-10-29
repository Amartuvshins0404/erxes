import type {
  EventDispatcherReturn,
  IResolvedConnection,
} from 'erxes-api-shared/core-modules';
import { ExpectedError } from 'erxes-api-shared/utils';
import { nanoid } from 'nanoid';
import { Model } from 'mongoose';
import type { IModels } from '~/connectionResolvers';
import type {
  ConnectionScope,
  IConnectionAddInput,
  IConnectionDocument,
  IConnectionEditInput,
} from '@/connections/@types/connection';
import {
  canServiceResolve,
  canUserUse,
  toResolvedConnection,
} from '@/connections/access';
import { sealSecret } from '@/connections/crypto';
import { connectionSchema } from '@/connections/db/definitions/connections';
import { getConnectionType, listConnectionTypes } from '@/connections/types';
import type { IConnectionTypeDefinition } from '@/connections/types';
import {
  assertRequiredSecrets,
  mergeConfigInput,
  normalizeConfig,
  normalizeName,
  normalizeSecretInput,
  normalizeServices,
} from '@/connections/validation';

export interface IConnectionListFilter {
  type?: string | null;
  category?: string | null;
  scope?: string | null;
}

export interface IConnectionModel extends Model<IConnectionDocument> {
  getConnection(_id: string): Promise<IConnectionDocument>;
  listForUser(
    userId: string,
    filter?: IConnectionListFilter,
  ): Promise<IConnectionDocument[]>;
  getForUser(_id: string, userId: string): Promise<IConnectionDocument | null>;
  addConnection(
    input: IConnectionAddInput,
    userId: string,
  ): Promise<IConnectionDocument>;
  editConnection(
    _id: string,
    input: IConnectionEditInput,
    userId: string,
  ): Promise<IConnectionDocument>;
  removeConnection(_id: string): Promise<void>;
  resolveForService(
    _id: string,
    serviceName: string,
  ): Promise<IResolvedConnection>;
  resolveForUser(
    _id: string,
    userId: string,
  ): Promise<{ resolved: IResolvedConnection; unreadable: string[] } | null>;
}

const notFound = () => new ExpectedError('Connection not found', 'NOT_FOUND');

const requireDefinition = (type: string): IConnectionTypeDefinition => {
  const definition = getConnectionType(type);

  if (!definition) {
    throw new ExpectedError(
      `Unsupported connection type "${type}".`,
      'VALIDATION_ERROR',
    );
  }

  return definition;
};

const parseScope = (scope: string | undefined): ConnectionScope => {
  if (scope === undefined || scope === null || scope === 'workspace') {
    return 'workspace';
  }

  if (scope === 'personal') {
    return 'personal';
  }

  throw new ExpectedError(
    'Scope must be "workspace" or "personal".',
    'VALIDATION_ERROR',
  );
};

const toLogDocument = (document: IConnectionDocument) => {
  const { secrets, ...rest } = document.toObject();

  return { ...rest, secretFields: Object.keys(secrets || {}) };
};

export const loadConnectionClass = (
  models: IModels,
  { sendDbEventLog }: EventDispatcherReturn,
) => {
  class Connection {
    public static async getConnection(_id: string) {
      const connection = await models.Connections.findOne({ _id });

      if (!connection) {
        throw notFound();
      }

      return connection;
    }

    public static async listForUser(
      userId: string,
      filter: IConnectionListFilter = {},
    ) {
      const query: Record<string, unknown> = {
        $or: [{ scope: 'workspace' }, { scope: 'personal', ownerId: userId }],
      };
      const and: Record<string, unknown>[] = [];

      if (filter.scope) {
        and.push({ scope: filter.scope });
      }

      if (filter.type) {
        and.push({ type: filter.type });
      }

      if (filter.category) {
        and.push({
          type: {
            $in: listConnectionTypes(filter.category).map(({ type }) => type),
          },
        });
      }

      if (and.length) {
        query.$and = and;
      }

      return models.Connections.find(query).sort({ createdAt: 1 });
    }

    public static async getForUser(_id: string, userId: string) {
      const connection = await models.Connections.findOne({ _id });

      return connection && canUserUse(connection, userId) ? connection : null;
    }

    public static async addConnection(
      input: IConnectionAddInput,
      userId: string,
    ) {
      const definition = requireDefinition(input.type);
      const scope = parseScope(input.scope);
      const _id = nanoid();
      const config = normalizeConfig(definition, input.config);
      const secretInput = normalizeSecretInput(definition, input.secrets);
      const plainSecrets = Object.entries(secretInput).filter(
        ([, value]) => value !== '',
      );

      assertRequiredSecrets(
        definition,
        plainSecrets.map(([field]) => field),
      );

      const secrets: Record<string, string> = {};

      for (const [field, plain] of plainSecrets) {
        secrets[field] = sealSecret({ connectionId: _id, field, plain });
      }

      const connection = await models.Connections.create({
        _id,
        type: definition.type,
        name: normalizeName(input.name),
        scope,
        ...(scope === 'personal' ? { ownerId: userId } : {}),
        config,
        secrets,
        services:
          scope === 'workspace'
            ? normalizeServices(input.services ?? definition.defaultServices)
            : [],
        createdBy: userId,
        updatedBy: userId,
      });

      sendDbEventLog({
        action: 'create',
        docId: connection._id,
        currentDocument: toLogDocument(connection),
      });

      return connection;
    }

    public static async editConnection(
      _id: string,
      input: IConnectionEditInput,
      userId: string,
    ) {
      const current = await models.Connections.getConnection(_id);
      const definition = requireDefinition(current.type);
      const before = toLogDocument(current);
      const secretInput = normalizeSecretInput(definition, input.secrets);
      const secrets: Record<string, string> = { ...(current.secrets || {}) };

      for (const [field, plain] of Object.entries(secretInput)) {
        if (plain === '') {
          delete secrets[field];
        } else {
          secrets[field] = sealSecret({ connectionId: _id, field, plain });
        }
      }

      assertRequiredSecrets(definition, Object.keys(secrets));

      const update: Record<string, unknown> = { secrets, updatedBy: userId };

      if (input.name !== undefined) {
        update.name = normalizeName(input.name);
      }

      if (input.config !== undefined) {
        update.config = normalizeConfig(
          definition,
          mergeConfigInput(current.config || {}, input.config),
        );
      }

      if (input.services !== undefined) {
        update.services =
          current.scope === 'workspace'
            ? normalizeServices(input.services)
            : [];
      }

      const updated = await models.Connections.findOneAndUpdate(
        { _id },
        { $set: update },
        { new: true },
      );

      if (!updated) {
        throw notFound();
      }

      sendDbEventLog({
        action: 'update',
        docId: _id,
        currentDocument: toLogDocument(updated),
        prevDocument: before,
      });

      return updated;
    }

    public static async removeConnection(_id: string) {
      await models.Connections.getConnection(_id);
      await models.Connections.deleteOne({ _id });

      sendDbEventLog({ action: 'delete', docId: _id });
    }

    public static async resolveForService(_id: string, serviceName: string) {
      const connection = await models.Connections.findOne({ _id });

      if (!connection || !canServiceResolve(connection, serviceName)) {
        throw notFound();
      }

      const { resolved, unreadable } = toResolvedConnection(connection);

      if (unreadable.length) {
        throw new ExpectedError(
          'Connection secrets cannot be decrypted. Re-enter them in Settings → Connections.',
          'SERVER_ERROR',
        );
      }

      return resolved;
    }

    public static async resolveForUser(_id: string, userId: string) {
      const connection = await models.Connections.getForUser(_id, userId);

      return connection ? toResolvedConnection(connection) : null;
    }
  }

  connectionSchema.loadClass(Connection);

  return connectionSchema;
};
