import { copyFileSync, mkdirSync, writeFileSync, cpSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");
const outputDir = join(rootDir, ".vercel", "output");

console.log("Creating Vercel Build Output API v3 structure...");

// Clean and create output directory
if (existsSync(outputDir)) {
  console.log("Removing existing .vercel/output directory...");
}
mkdirSync(outputDir, { recursive: true });

// Create config.json
const config = {
  version: 3,
  routes: [
    {
      src: "^/assets/(.*)$",
      headers: {
        "cache-control": "public, max-age=31536000, immutable",
      },
      continue: true,
    },
    {
      handle: "filesystem",
    },
    {
      src: ".*",
      dest: "/api/index",
    },
  ],
};

writeFileSync(join(outputDir, "config.json"), JSON.stringify(config, null, 2));
console.log("✓ Created config.json");

// Create static directory and copy client assets
const staticDir = join(outputDir, "static");
mkdirSync(staticDir, { recursive: true });

const clientDir = join(rootDir, "dist", "client");
if (existsSync(clientDir)) {
  cpSync(clientDir, staticDir, { recursive: true });
  console.log("✓ Copied client assets to static/");
} else {
  console.warn("⚠ Client dist directory not found");
}

// Create functions directory
const functionsDir = join(outputDir, "functions");
mkdirSync(functionsDir, { recursive: true });

// Create API function directory
const apiFunctionDir = join(functionsDir, "api", "index.func");
mkdirSync(apiFunctionDir, { recursive: true });

// Create .vc-config.json for the function
const vcConfig = {
  runtime: "nodejs20.x",
  handler: "index.mjs",
  launcherType: "Nodejs",
  shouldAddHelpers: true,
};

writeFileSync(
  join(apiFunctionDir, ".vc-config.json"),
  JSON.stringify(vcConfig, null, 2),
);
console.log("✓ Created function config");

// Create the serverless function handler
const serverHandler = `
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

// Import the TanStack Start server
let server;

export default async function handler(req, res) {
  try {
    // Lazy load the server module
    if (!server) {
      const serverPath = join(__dirname, 'server.js');
      server = await import(serverPath);
    }

    // Convert Vercel request to Web API Request
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const url = new URL(req.url || '/', \`\${protocol}://\${host}\`);

    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          for (const v of value) {
            headers.append(key, v);
          }
        } else {
          headers.set(key, value);
        }
      }
    }

    let body = undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      if (req.body) {
        if (typeof req.body === 'string') {
          body = req.body;
        } else if (Buffer.isBuffer(req.body)) {
          body = req.body;
        } else {
          body = JSON.stringify(req.body);
        }
      }
    }

    const request = new Request(url, {
      method: req.method,
      headers,
      body,
    });

    // Call the TanStack Start fetch handler
    const response = await server.default.fetch(request);

    // Set status
    res.status(response.status);

    // Set headers
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    // Stream or send the response body
    if (response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let result = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        result += decoder.decode(value, { stream: true });
      }

      res.send(result);
    } else {
      res.end();
    }
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
}
`;

writeFileSync(join(apiFunctionDir, "index.mjs"), serverHandler.trim());
console.log("✓ Created serverless function handler");

// Copy server dist to the function directory
const serverDir = join(rootDir, "dist", "server");
if (existsSync(serverDir)) {
  cpSync(serverDir, apiFunctionDir, { recursive: true });
  console.log("✓ Copied server bundle to function directory");
} else {
  console.warn("⚠ Server dist directory not found");
}

console.log("\n✅ Vercel output structure created successfully!");
console.log(`Output directory: ${outputDir}`);
