'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { performance } = require('node:perf_hooks');
const { createApi, sendProblem } = require('./app');
const { Store } = require('./store');

const ROOT = path.resolve(__dirname, '..');
const MIME = Object.freeze({
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
});
const PUBLIC_FILES = new Set(['index.html', 'sw.js', 'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png', 'frontend/app.js', 'frontend/styles.css', 'frontend/repository.js', 'frontend/modules.js', 'frontend/offline.js','frontend/domain.mjs','frontend/charts.js']);

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
  return PUBLIC_FILES.has(relative.replace(/\\/g, '/')) ? resolved : null;
}

function createServer({ logger = console, store, secure = false, timeZone = 'Europe/Budapest', publicOrigin } = {}) {
  const ownedStore = !store;
  store = store || new Store();
  const api = createApi({ store, logger, secure, timeZone });
  const allowedHosts = new Set(['localhost', '127.0.0.1', '[::1]']);
  if (publicOrigin) allowedHosts.add(new URL(publicOrigin).hostname);
  const server = http.createServer(async (request, response) => {
    const started = performance.now();
    const pathname = new URL(request.url, 'http://localhost').pathname;
    response.setHeader('x-content-type-options', 'nosniff');
    response.setHeader('x-frame-options', 'DENY');
    response.setHeader('referrer-policy', 'strict-origin-when-cross-origin');
    response.setHeader('permissions-policy', 'camera=(), microphone=(), geolocation=()');
    response.setHeader('content-security-policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
    let hostname;
    try { hostname = new URL(`http://${request.headers.host}`).hostname; } catch { hostname = ''; }
    if (!allowedHosts.has(hostname)) return sendProblem(response, 421, 'Érvénytelen kiszolgálónév', 'Ez a Host nincs engedélyezve.', 'host');

    response.on('finish', () => {
      logger.info(JSON.stringify({
        event: 'http_request',
        method: request.method,
        route: pathname.startsWith('/api/') ? pathname.split('/').slice(0,4).join('/') : pathname,
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
  server.impavidusStore=store;
  server.on('close', () => { if (ownedStore) store.close(); });
  return server;
}

function start() {
  const envFile = path.join(ROOT, '.env');
  if (fs.existsSync(envFile)) process.loadEnvFile(envFile);
  if (process.env.DATABASE_URL) throw new Error('Ez a kiadás SQLite-adaptert használ. DATABASE_URL nem köthető be automatikusan; töröld a mintából, vagy készíts PostgreSQL-adaptert.');
  const timeZone = process.env.APP_TIMEZONE || 'Europe/Budapest';
  new Intl.DateTimeFormat('hu-HU', { timeZone }).format();
  const port = Number(process.env.PORT || 8082);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT értéke 1 és 65535 közé essen.');
  if (process.env.NODE_ENV === 'production' && process.env.COOKIE_SECURE !== 'true') throw new Error('Éles módban HTTPS proxy és COOKIE_SECURE=true szükséges.');
  const publicOrigin = process.env.PUBLIC_ORIGIN;
  if (process.env.NODE_ENV === 'production' && (!publicOrigin || new URL(publicOrigin).protocol !== 'https:')) throw new Error('Éles módban HTTPS PUBLIC_ORIGIN szükséges.');
  require('./backups').settings();
  const server = createServer({ secure: process.env.COOKIE_SECURE === 'true', timeZone, publicOrigin });
  server.on('error', error => {
    console.error(error.code === 'EADDRINUSE' ? `A ${port} port már foglalt. Állíts be másik PORT értéket az .env fájlban.` : `A szerver nem indult: ${error.code || error.message}`);
    server.close();
    process.exitCode = 1;
  });
  server.listen(port, '127.0.0.1', () => console.info(`IMPAVIDUS LAB: http://127.0.0.1:${port} · SQLite · ${timeZone}`));
  const stopBackups=require('./backups').schedule(server.impavidusStore,console);
  let stopping=false;const shutdown = async() => {if(stopping)return;stopping=true;await stopBackups();server.close(() => process.exit(0));};
  require('../scripts/local-control').attach(server,shutdown);
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
  return server;
}

module.exports = { ROOT, createServer, start, staticPath };
