'use strict';

const ROLES = Object.freeze(['client', 'coach', 'admin']);

function hasRole(principal, allowedRoles) {
  if (!principal || !ROLES.includes(principal.role)) return false;
  return principal.role === 'admin' || allowedRoles.includes(principal.role);
}

function canAccessClient(principal, clientId, coachAssignments = []) {
  if (!principal || !clientId) return false;
  if (principal.role === 'admin') return true;
  if (principal.role === 'client') return principal.clientId === clientId;
  return principal.role === 'coach' && coachAssignments.some(
    assignment => assignment.coachId === principal.id && assignment.clientId === clientId && assignment.active === true,
  );
}

function requirePrincipal(request, response) {
  if (request.principal) return true;
  response.writeHead(401, { 'content-type': 'application/problem+json; charset=utf-8' });
  response.end(JSON.stringify({
    type: 'https://impavidus.local/problems/authentication-required',
    title: 'Hitelesítés szükséges',
    status: 401,
    detail: 'A szerveroldali fiók- és munkamenet-kezelés még nincs konfigurálva.',
  }));
  return false;
}

function requireRole(request, response, allowedRoles) {
  if (!requirePrincipal(request, response)) return false;
  if (hasRole(request.principal, allowedRoles)) return true;
  response.writeHead(403, { 'content-type': 'application/problem+json; charset=utf-8' });
  response.end(JSON.stringify({
    type: 'https://impavidus.local/problems/forbidden',
    title: 'Nincs jogosultság',
    status: 403,
    detail: 'A művelethez nincs megfelelő szerepkör.',
  }));
  return false;
}

module.exports = { ROLES, canAccessClient, hasRole, requirePrincipal, requireRole };
