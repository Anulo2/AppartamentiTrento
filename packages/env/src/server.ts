import "dotenv/config";
import arkenv from "arkenv";

export const env = arkenv({
  DATABASE_URL: "string.min(1)",
  TURSO_DATABASE_URL: "string.url?",
  TURSO_AUTH_TOKEN: "string.min(1)?",
  BETTER_AUTH_SECRET: "string.min(32)",
  BETTER_AUTH_URL: "string.url",
  CORS_ORIGIN: "string.url",
  OPENROUTESERVICE_API_KEY: "string?",
  GEOAPIFY_API_KEY: "string?",
  NODE_ENV: "'development' | 'production' | 'test' = 'development'",
});
