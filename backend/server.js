'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { performance } = require('node:perf_hooks');
const { createApi, sendProblem } = require('./app');

const ROOT = path.resolve(__dirname, '..');
const MIME = Object.freeze({
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
});
const PUBLIC_FILES = new Set(['index.html', 'sw.js', 'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png']);

function staticPath(urlPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath.split('?')[0]);
  } catch {
    return null;
  }
  const relative = decoded === '/' ? 'index.html' : decoded.replace(/^\/+/, '');
  const resolved = path.resolve(ROOT, relative);
  if (resolved !== ROOT && !resolved.startsWith(ROOT + path.sep)) return null;
  return path.dirname(resolved) === ROOT && PUBLIC_FILES.has(path.basename(resolved)) ? resolved : null;
}

function createServer({ logger = console } = {}) {
  const api = createApi();
  return http.createServer(async (request, response) => {
    const started = performance.now();
    const pathname = new URL(request.url, 'http://localhost').pathname;
    response.setHeader('x-content-type-options', 'nosniff');
    response.setHeader('x-frame-options', 'DENY');
    response.setHeader('referrer-policy', 'strict-origin-when-cross-origin');
    response.setHeader('permissions-policy', 'camera=(), microphone=(), geolocation=()');

    response.on('finish', () => {
      logger.info(JSON.stringify({
        event: 'http_request',
        method: request.method,
        path: pathname,
        status: response.statusCode,
        durationMs: Math.round(performance.now() - started),
      }));
    });

    if (pathname.startsWith('/api/')) return api(request, response);
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response.setHeader('allow', 'GET, HEAD');
      return sendProblem(response, 405, 'Nem támogatott metódus', 'A statikus fájlkiszolgáló csak olvasást enged.', 'method-not-allowed');
    }

    const file = staticPath(request.url);
    if (!file) return sendProblem(response, 400, 'Hibás útvonal', 'A megadott fájlútvonal nem érvényes.', 'bad-path');
    fs.readFile(file, (error, contents) => {
      if (error) {
        response.writeHead(error.code === 'ENOENT' ? 404 : 500, { 'content-type': 'text/plain; charset=utf-8' });
        return response.end(error.code === 'ENOENT' ? 'Nincs ilyen fájl.' : 'A fájl nem olvasható.');
      }
      const headers = { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' };
      if (['index.html', 'sw.js', 'manifest.webmanifest'].includes(path.basename(file))) headers['cache-control'] = 'no-cache';
      response.writeHead(200, headers);
      response.end(request.method === 'HEAD' ? undefined : contents);
    });
  });
}

function start() {
  const port = Number(process.env.PORT || 8080);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT értéke 1 és 65535 közé essen.');
  const server = createServer();
  server.listen(port, '127.0.0.1', () => console.info(`Impavidus Lab fejlesztői szerver: http://127.0.0.1:${port}`));
  return server;
}

module.exports = { ROOT, createServer, start, staticPath };
