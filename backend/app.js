'use strict';

const { randomUUID } = require('node:crypto');

const API_PREFIX = '/api/v1';

function sendProblem(response, status, title, detail, code) {
  response.writeHead(status, { 'content-type': 'application/problem+json; charset=utf-8' });
  response.end(JSON.stringify({
    type: `https://impavidus.local/problems/${code}`,
    title,
    status,
    detail,
    code,
  }));
}

function createApi() {
  return async function api(request, response) {
    const requestId = randomUUID();
    response.setHeader('x-request-id', requestId);
    response.setHeader('cache-control', 'no-store');

    let pathname;
    try {
      pathname = new URL(request.url, 'http://localhost').pathname;
    } catch {
      return sendProblem(response, 400, 'Hibás kérés', 'Az útvonal nem értelmezhető.', 'bad-request');
    }

    if (request.method !== 'GET' && request.method !== 'HEAD' && request.method !== 'POST') {
      response.setHeader('allow', 'GET, HEAD, POST');
      return sendProblem(response, 405, 'Nem támogatott metódus', 'Ez a HTTP metódus nincs engedélyezve.', 'method-not-allowed');
    }

    if (pathname === `${API_PREFIX}/health` && (request.method === 'GET' || request.method === 'HEAD')) {
      response.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
      return response.end(JSON.stringify({
        status: 'ok',
        service: 'impavidus-lab',
        database: 'not-configured',
        authentication: 'not-configured',
        requestId,
      }));
    }

    if (pathname === `${API_PREFIX}/ready`) {
      return sendProblem(response, 503, 'A szolgáltatás még nem kész', 'A PostgreSQL-kapcsolat és a perzisztens adattár nincs bekötve.', 'dependencies-not-configured');
    }

    if (pathname === `${API_PREFIX}/auth/session`) {
      if (request.method === 'GET' || request.method === 'HEAD') {
        return sendProblem(response, 401, 'Hitelesítés szükséges', 'Nincs konfigurált szerveroldali fiók vagy munkamenet.', 'authentication-required');
      }
      return sendProblem(response, 501, 'A hitelesítés nincs bekötve', 'A munkamenet-végpont adatbázist és hitelesítési szolgáltatót igényel.', 'authentication-not-configured');
    }

    if (pathname.startsWith(`${API_PREFIX}/`)) {
      return sendProblem(response, 501, 'A végpont még nincs megvalósítva', 'Ez az API-váz nem végez kliensadat-műveletet.', 'endpoint-not-implemented');
    }

    return sendProblem(response, 404, 'Nem található', 'Nincs ilyen API-útvonal.', 'not-found');
  };
}

module.exports = { API_PREFIX, createApi, sendProblem };
