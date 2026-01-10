import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  clientPrefix: "VITE_",
  client: {
    VITE_GEOAPIFY_API_KEY: z.string().optional(),
  },
  runtimeEnv: (import.meta as { env: Record<string, string | undefined> }).env,
  emptyStringAsUndefined: true,
});
