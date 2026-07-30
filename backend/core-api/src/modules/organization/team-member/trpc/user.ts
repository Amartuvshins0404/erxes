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
    // Mints a short-lived (1h) gateway-verifiable token for an agent's owner so
    // background runs (bot/schedule) act as a real, bounded user instead of the
    // privileged app token. Authenticated with the erxes App token (the core
    // Apps collection, tenant-scoped via ctx.models — the same credential the
    // gateway validates) rather than a bespoke shared secret, so there is no
    // extra env var to provision. Returns null (never throws / never reveals
    // which check failed) when the app token is missing/invalid/revoked or the
    // owner is missing/inactive. Never logs the token.
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

        // The owner must be a real, active user — a deactivated owner stops the
        // background run cold.
        const user = await models.Users.findOne({
          _id: userId,
          isActive: { $ne: false },
        });

        if (!user) {
          return null;
        }

        // Run tokens are for BOUNDED background automation — never god-mode. An
        // org owner (isOwner) short-circuits every permission check, so refuse to
        // mint a run token for one; this forces exposed bots/schedules onto a
        // scoped, non-owner owner (an org-owner-owned background run then fails
        // closed rather than acting as god-mode on prompt-injectable input).
        if (user.isOwner) {
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
        await redis.set('user_token_' + user._id + '_' + token, 1, 'EX', 60 * 60);

        return { token };
      }),
  }),
});
