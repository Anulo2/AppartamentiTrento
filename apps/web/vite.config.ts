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
      output: {
        manualChunks: undefined, // Disable code splitting for both builds to avoid ArkType issues
      },
    },
    chunkSizeWarningLimit: 2000, // Increase limit since we're not splitting
  },
});
