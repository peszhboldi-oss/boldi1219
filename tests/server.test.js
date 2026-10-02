'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createServer, staticPath } = require('../backend/server');

test('publikus fájl allowlist útvonalakat fogad el és kizárja a privát fájlokat', () => {
  assert.ok(staticPath('/index.html').endsWith('index.html'));
  assert.ok(staticPath('/icon.svg').endsWith('icon.svg'));
  assert.equal(staticPath('/.env.example'), null);
  assert.equal(staticPath('/backend/app.js'), null);
  assert.equal(staticPath('/db/migrations/001_initial_schema.sql'), null);
  assert.equal(staticPath('/%2e%2e/outside.txt'), null);
});

test('az API világosan jelzi, hogy az adatbázis és a hitelesítés még nincs beállítva', async t => {
  const logs = [];
  const server = createServer({ logger: { info: entry => logs.push(JSON.parse(entry)) } });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;

  const health = await fetch(`${base}/api/v1/health`);
  assert.equal(health.status, 200);
  assert.deepEqual((await health.json()).database, 'not-configured');

  const ready = await fetch(`${base}/api/v1/ready`);
  assert.equal(ready.status, 503);

  const session = await fetch(`${base}/api/v1/auth/session`);
  assert.equal(session.status, 401);

  const login = await fetch(`${base}/api/v1/auth/session`, { method: 'POST' });
  assert.equal(login.status, 501);
  assert.ok(logs.every(event => event.path && event.status));
});

test('az alkalmazás statikus oldalt és PWA fájlokat szolgál ki', async t => {
  const server = createServer({ logger: { info() {} } });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;

  const page = await fetch(base);
  assert.equal(page.status, 200);
  const html = await page.text();
  assert.match(html, /Alex team/i);
  assert.match(html, /DEMÓ · HELYI ADAT/);
  for (const pageName of ['Adatlap', 'Napi napló', 'Heti összesítő', 'Edzésnapló', 'Étrend', 'Kajanapló', 'Gyógyszer', 'Mérések', 'Fotónapló', 'Beállítások']) {
    assert.ok(html.includes(pageName), `missing navigation page: ${pageName}`);
  }

  const manifest = await fetch(`${base}/manifest.webmanifest`);
  assert.equal(manifest.status, 200);
  const denied = await fetch(`${base}/backend/app.js`);
  assert.equal(denied.status, 400);
});
