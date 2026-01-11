import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load the TanStack Start server
let serverModule;

async function loadServer() {
  if (!serverModule) {
    const serverPath = join(__dirname, '..', 'apps', 'web', 'dist', 'server', 'server.js');
    serverModule = await import(serverPath);
  }
  return serverModule.default;
}

export default async function handler(req, res) {
  try {
    const server = await loadServer();

    // Build the full URL
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const url = new URL(req.url || '/', `${protocol}://${host}`);

    // Create headers
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          for (const v of value) {
            headers.append(key, v);
          }
        } else {
          headers.set(key, String(value));
        }
      }
    }

    // Handle request body
    let body;
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

    // Create Web API Request
    const request = new Request(url.toString(), {
      method: req.method,
      headers,
      body,
    });

    // Call the server fetch handler
    const response = await server.fetch(request);

    // Set response status
    res.status(response.status);

    // Set response headers
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    // Send response body
    if (response.body) {
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      res.send(buffer);
    } else {
      res.end();
    }
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
        <head><title>500 - Server Error</title></head>
        <body>
          <h1>500 - Internal Server Error</h1>
          <pre>${error.message}</pre>
          <pre>${error.stack}</pre>
        </body>
      </html>
    `);
  }
}
