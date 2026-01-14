import { env } from "@AppartamentiTrento/env/server";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import {
  account,
  accountRelations,
  apartment,
  apartmentRelations,
  contatto,
  contattoRelations,
  session,
  sessionRelations,
  user,
  userRelations,
  verification,
} from "./schema";

console.log("[DB] Initializing database connection...");
console.log("[DB] TURSO_DATABASE_URL is set:", !!env.TURSO_DATABASE_URL);
console.log("[DB] TURSO_AUTH_TOKEN is set:", !!env.TURSO_AUTH_TOKEN);
console.log("[DB] DATABASE_URL:", env.DATABASE_URL);

let client;
try {
  if (env.TURSO_DATABASE_URL) {
    console.log("[DB] Using Turso database:", env.TURSO_DATABASE_URL);
    client = createClient({
      url: env.TURSO_DATABASE_URL,
      authToken: env.TURSO_AUTH_TOKEN,
    });
  } else {
    console.log("[DB] Using local SQLite file:", `file:${env.DATABASE_URL}`);
    client = createClient({
      url: `file:${env.DATABASE_URL}`,
    });
  }
  console.log("[DB] Database client created successfully");
} catch (error) {
  console.error("[DB] Error creating database client:", error);
  throw error;
}

export const db = drizzle({
  client,
  schema: {
    account,
    accountRelations,
    apartment,
    apartmentRelations,
    contatto,
    contattoRelations,
    session,
    sessionRelations,
    user,
    userRelations,
    verification,
  },
});

console.log("[DB] Drizzle ORM initialized successfully");
