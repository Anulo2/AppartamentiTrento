// biome-ignore lint/style/useFilenamingConvention: convenzione TanStack Router
import { createContext } from "@AppartamentiTrento/api/context";
import { appRouter } from "@AppartamentiTrento/api/routers/index";
import { experimental_ArkTypeToJsonSchemaConverter } from "@orpc/arktype";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { createFileRoute } from "@tanstack/react-router";

const rpcHandler = new RPCHandler(appRouter, {
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
});

const apiHandler = new OpenAPIHandler(appRouter, {
  plugins: [
    new OpenAPIReferencePlugin({
      schemaConverters: [new experimental_ArkTypeToJsonSchemaConverter()],
    }),
  ],
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
});

async function handle({ request }: { request: Request }) {
  try {
    console.log("[API] Handling request:", request.url);

    let context;
    try {
      context = await createContext({ req: request });
      console.log("[API] Context created successfully");
    } catch (contextError) {
      console.error("[API] Error creating context:", contextError);
      return new Response(
        JSON.stringify({
          status: 500,
          message: "Failed to create context",
          error: contextError instanceof Error ? contextError.message : String(contextError),
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const rpcResult = await rpcHandler.handle(request, {
      prefix: "/api/rpc",
      context,
    });
    if (rpcResult.response) {
      return rpcResult.response;
    }

    const apiResult = await apiHandler.handle(request, {
      prefix: "/api/rpc/api-reference",
      context,
    });
    if (apiResult.response) {
      return apiResult.response;
    }

    return new Response("Not found", { status: 404 });
  } catch (error) {
    console.error("[API] Unhandled error:", error);
    return new Response(
      JSON.stringify({
        status: 500,
        message: "Internal server error",
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export const Route = createFileRoute("/api/rpc/$")({
  server: {
    handlers: {
      HEAD: handle,
      GET: handle,
      POST: handle,
      PUT: handle,
      PATCH: handle,
      DELETE: handle,
    },
  },
});
