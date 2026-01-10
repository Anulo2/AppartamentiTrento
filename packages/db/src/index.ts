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

const client = createClient({
  url: `file:${env.DATABASE_URL}`,
});

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
