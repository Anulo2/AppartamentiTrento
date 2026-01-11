import { copyFileSync, mkdirSync, writeFileSync, cpSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");
const projectRoot = join(rootDir, "..", "..");
const outputDir = join(projectRoot, ".vercel", "output");

console.log("Creating Vercel Build Output API v3 structure...");

// Clean and create output directory
if (existsSync(outputDir)) {
  console.log("Removing existing .vercel/output directory...");
  const { rmSync } = await import('node:fs');
  rmSync(outputDir, { recursive: true, force: true });
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
      src: "/(.*)",
      dest: "/index",
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

// Create index function directory
const indexFunctionDir = join(functionsDir, "index.func");
mkdirSync(indexFunctionDir, { recursive: true });

// Create .vc-config.json for the function
const vcConfig = {
  runtime: "nodejs20.x",
  handler: "index.mjs",
  launcherType: "Nodejs",
  shouldAddHelpers: true,
};

writeFileSync(
  join(indexFunctionDir, ".vc-config.json"),
  JSON.stringify(vcConfig, null, 2),
);
console.log("✓ Created function config");

// Create the serverless function handler
const serverHandler = `
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import the TanStack Start server
let server;

export default async function handler(req, res) {
  try {
    // Lazy load the server module
    if (!server) {
      const serverPath = join(__dirname, 'server.js');
      const serverModule = await import(serverPath);
      server = serverModule.default;
    }

    // Convert Vercel request to Web API Request
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const pathname = req.url || '/';
    const url = new URL(pathname, \`\${protocol}://\${host}\`);

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

    const request = new Request(url.toString(), {
      method: req.method,
      headers,
      body,
    });

    // Call the TanStack Start fetch handler
    const response = await server.fetch(request);

    // Set status
    res.status(response.status);

    // Set headers
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    // Get content type
    const contentType = response.headers.get('content-type') || '';

    // Stream or send the response body
    if (response.body) {
      if (contentType.includes('text/html') || contentType.includes('application/json') || contentType.includes('text/')) {
        const text = await response.text();
        res.send(text);
      } else {
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        res.send(buffer);
      }
    } else {
      res.end();
    }
  } catch (error) {
    console.error('Server error:', error);
    console.error('Stack:', error.stack);
    res.status(500).send(\`
      <!DOCTYPE html>
      <html>
        <head><title>500 - Server Error</title></head>
        <body>
          <h1>500 - Internal Server Error</h1>
          <pre>\${error.message}</pre>
          <pre>\${error.stack}</pre>
        </body>
      </html>
    \`);
  }
}
`;

writeFileSync(join(indexFunctionDir, "index.mjs"), serverHandler.trim());
console.log("✓ Created serverless function handler");

// Copy server dist to the function directory
const serverDir = join(rootDir, "dist", "server");
if (existsSync(serverDir)) {
  cpSync(serverDir, indexFunctionDir, { recursive: true });
  console.log("✓ Copied server bundle to function directory");
} else {
  console.warn("⚠ Server dist directory not found");
}

console.log("\n✅ Vercel output structure created successfully!");
console.log(`Output directory: ${outputDir}`);
