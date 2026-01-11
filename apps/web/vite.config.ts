// Vercel deployment configuration for TanStack Start
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), tailwindcss(), tanstackStart(), viteReact()],
  server: {
    port: 3001,
  },
  ssr: {
    noExternal: true,
  },
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress circular dependency warnings for arktype
        if (warning.code === 'CIRCULAR_DEPENDENCY' && warning.message.includes('arktype')) {
          return;
        }
        warn(warning);
      },
      output: {
        manualChunks: (id) => {
          // Split React and React-DOM into separate chunk
          if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/")) {
            return "react-vendor";
          }

          // Split TanStack libraries into their own chunk
          // Separate router and query as they're used together frequently
          if (
            id.includes("node_modules/@tanstack/react-router") ||
            id.includes("node_modules/@tanstack/router-plugin") ||
            id.includes("node_modules/@tanstack/react-start")
          ) {
            return "tanstack-router-vendor";
          }
          if (
            id.includes("node_modules/@tanstack/react-query") ||
            id.includes("node_modules/@tanstack/react-router-with-query")
          ) {
            return "tanstack-query-vendor";
          }
          if (id.includes("node_modules/@tanstack/")) {
            return "tanstack-vendor";
          }

          // Split better-auth into its own chunk (very large)
          if (id.includes("node_modules/better-auth")) {
            return "auth-vendor";
          }

          // Split Leaflet and react-leaflet (already lazy-loaded but good to separate)
          if (
            id.includes("node_modules/leaflet") ||
            id.includes("node_modules/react-leaflet")
          ) {
            return "leaflet-vendor";
          }

          // Split UI component libraries (base-ui, shadcn)
          if (
            id.includes("node_modules/@base-ui/") ||
            id.includes("node_modules/class-variance-authority") ||
            id.includes("node_modules/clsx") ||
            id.includes("node_modules/tailwind-merge") ||
            id.includes("node_modules/sonner")
          ) {
            return "ui-vendor";
          }

          // Split lucide-react icons into separate chunk
          if (id.includes("node_modules/lucide-react")) {
            return "icons-vendor";
          }

          // Split ORPC and related libraries
          if (id.includes("node_modules/@orpc/")) {
            return "orpc-vendor";
          }

          // Split database and ORM libraries
          if (
            id.includes("node_modules/@libsql/") ||
            id.includes("node_modules/libsql") ||
            id.includes("node_modules/drizzle-orm")
          ) {
            return "db-vendor";
          }

          // Split validation libraries
          if (
            id.includes("node_modules/arktype") ||
            id.includes("node_modules/zod")
          ) {
            return "validation-vendor";
          }

          // All other node_modules go into vendor chunk
          if (id.includes("node_modules/")) {
            return "vendor";
          }
        },
      },
    },
    // Increase chunk size warning limit to 1000KB to avoid noise
    // We're actively working on chunk optimization
    chunkSizeWarningLimit: 1000,
  },
});
