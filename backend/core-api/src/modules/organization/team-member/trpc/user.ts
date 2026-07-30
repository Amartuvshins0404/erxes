import { initTRPC } from '@trpc/server';
import { redis } from 'erxes-api-shared/utils';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import { z } from 'zod';
import { CoreTRPCContext } from '~/init-trpc';

const t = initTRPC.context<CoreTRPCContext>().create();

export const userTrpcRouter = t.router({
  users: t.router({
    find: t.procedure
      .input(
        z.object({
          query: z.record(z.any()),
          fields: z.record(z.any()).optional(),
        }),
      )
      .query(async ({ ctx, input }) => {
        const { query, fields } = input;
        const { models } = ctx;

        return models.Users.find(query, fields);
      }),
    findOne: t.procedure.input(z.any()).query(async ({ ctx, input }) => {
      const query = input?.query || input?.selector || input;
      const { models } = ctx;

      if (!query || !Object.keys(query).length) {
        return {};
      }

      return models.Users.findOne(query);
    }),

    updateOne: t.procedure.input(z.any()).mutation(async ({ ctx, input }) => {
      const { selector, modifier } = input;
      const { models } = ctx;

      if (!selector || !Object.keys(selector).length) {
        return {};
      }

      return models.Users.updateOne(selector, modifier);
    }),

    updateMany: t.procedure.input(z.any()).mutation(async ({ ctx, input }) => {
      const { selector, modifier } = input;
      const { models } = ctx;

      return models.Users.updateMany(selector, modifier);
    }),

    create: t.procedure.input(z.any()).mutation(async ({ ctx, input }) => {
      const { data } = input;
      const { models } = ctx;

      return models.Users.createUser(data);
    }),

    setActiveStatus: t.procedure
      .input(z.any())
      .mutation(async ({ ctx, input }) => {
        const { _id } = input;
        const { models } = ctx;

        return models.Users.setUserActiveOrInactive(_id);
      }),

    getCount: t.procedure.input(z.any()).query(async ({ ctx, input }) => {
      const { query } = input;
      const { models } = ctx;

      return models.Users.countDocuments(query);
    }),

    comparePassword: t.procedure
      .input(z.any())
      .query(async ({ ctx, input }) => {
        const { password, userPassword } = input;
        const { models } = ctx;

        return models.Users.comparePassword(password, userPassword);
      }),
    checkLoginAuth: t.procedure
      .input(
        z.object({
          email: z.string().email().max(255),
          password: z.string().min(1).max(255),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const { email, password } = input;
        const { models } = ctx;

        return await models.Users.checkLoginAuth({ email, password });
      }),
    // Mint a short-lived (1h), gateway-verifiable token only for a dedicated AI
    // team-member account. The erxes App token is a client credential, never
    // the acting principal. Core validates that credential against the
    // tenant-scoped Apps collection and then binds the token to a marked,
    // active, non-owner user. Missing/revoked credentials and ineligible users
    // all return null without revealing which check failed.
    issueRunToken: t.procedure
      .input(z.object({ userId: z.string(), appToken: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const { models } = ctx;
        const { userId, appToken } = input;

        // Authenticate the caller with the erxes App token. Look it up as an
        // ACTIVE app (revoked apps are rejected), then do a constant-time
        // compare on the final match. A missing/invalid/revoked token returns
        // null — never leaking which check failed.
        const app = await models.Apps.findOne({
          token: appToken,
          status: 'active',
        });

        if (!app) {
          return null;
        }

        const provided = Buffer.from(appToken);
        const expected = Buffer.from(app.token);

        if (
          provided.length !== expected.length ||
          !crypto.timingSafeEqual(provided, expected)
        ) {
          return null;
        }

        // Only a real, active, passwordless AI team-member account may become
        // the principal. Refusing ordinary users prevents an app credential
        // from becoming a general user-impersonation primitive; refusing owners
        // prevents prompt-injectable runs from acquiring god-mode.
        const user = await models.Users.findOne({
          _id: userId,
          isActive: { $ne: false },
        });

        if (
          !user ||
          user.role !== 'user' ||
          user.isOwner ||
          !user.appId?.startsWith('erxes-agent:')
        ) {
          return null;
        }

        // Sign with the SAME secret resolution the gateway verifies with, and
        // mirror createTokens' payload shape.
        const token = jwt.sign(
          { user: { _id: user._id, isOwner: user.isOwner } },
          process.env.JWT_TOKEN_SECRET || 'SECRET',
          { expiresIn: '1h' },
        );

        // Register the token under the exact Redis key the gateway checks. 1h
        // TTL matches the JWT expiry. Ephemeral — not pushed to validatedTokens.
        await redis.set(
          'user_token_' + user._id + '_' + token,
          1,
          'EX',
          60 * 60,
        );

        return { token };
      }),
  }),
});
