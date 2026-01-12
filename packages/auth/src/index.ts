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

console.log("[AUTH] Initializing better-auth...");
console.log("[AUTH] BETTER_AUTH_URL:", env.BETTER_AUTH_URL);
console.log("[AUTH] CORS_ORIGIN:", env.CORS_ORIGIN);
console.log("[AUTH] BETTER_AUTH_SECRET is set:", !!env.BETTER_AUTH_SECRET);
console.log("[AUTH] BETTER_AUTH_SECRET length:", env.BETTER_AUTH_SECRET?.length);

try {
  console.log("[AUTH] Creating drizzle adapter...");
} catch (error) {
  console.error("[AUTH] Error during setup:", error);
  throw error;
}

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

console.log("[AUTH] better-auth initialized successfully");
