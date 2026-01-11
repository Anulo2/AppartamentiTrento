import arkenv from "arkenv";

export const env = arkenv(
  {
    VITE_GEOAPIFY_API_KEY: "string?",
  },
  {
    runtimeEnv: (import.meta as { env: Record<string, string | undefined> })
      .env,
  }
);
