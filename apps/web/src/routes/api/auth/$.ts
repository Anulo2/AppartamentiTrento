// biome-ignore lint/style/useFilenamingConvention: convenzione TanStack Router
import { auth } from "@AppartamentiTrento/auth";
import { createFileRoute } from "@tanstack/react-router";

async function handleAuth({ request }: { request: Request }) {
  try {
    console.log("[AUTH] Handling request:", request.url);
    const response = await auth.handler(request);
    console.log("[AUTH] Response status:", response.status);
    return response;
  } catch (error) {
    console.error("[AUTH] Error:", error);
    return new Response(
      JSON.stringify({
        status: 500,
        message: "Auth error",
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: handleAuth,
      POST: handleAuth,
    },
  },
});
