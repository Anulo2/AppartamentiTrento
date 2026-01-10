import { db } from "@AppartamentiTrento/db";
import {
  account,
  session,
  user,
  verification,
} from "@AppartamentiTrento/db/schema/auth";
import { env } from "@AppartamentiTrento/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { tanstackStartCookies } from "better-auth/tanstack-start";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",

    schema: { account, session, user, verification },
  }),
  trustedOrigins: [env.CORS_ORIGIN],
  emailAndPassword: {
    enabled: true,
  },
  plugins: [tanstackStartCookies()],
});
