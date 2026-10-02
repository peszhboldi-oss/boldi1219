'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { canAccessClient, hasRole, ROLES } = require('../backend/access');

test('a támogatott szerepek kliens, edző és admin', () => {
  assert.deepEqual(ROLES, ['client', 'coach', 'admin']);
});

test('a kliens csak a saját kliensprofiljához fér hozzá', () => {
  assert.equal(canAccessClient({ id: 'u1', role: 'client', clientId: 'c1' }, 'c1'), true);
  assert.equal(canAccessClient({ id: 'u1', role: 'client', clientId: 'c1' }, 'c2'), false);
});

test('az edző csak aktív hozzárendeléssel fér hozzá klienshez', () => {
  const coach = { id: 't1', role: 'coach' };
  const active = [{ coachId: 't1', clientId: 'c1', active: true }];
  const inactive = [{ coachId: 't1', clientId: 'c1', active: false }];
  assert.equal(canAccessClient(coach, 'c1', active), true);
  assert.equal(canAccessClient(coach, 'c1', inactive), false);
  assert.equal(canAccessClient(coach, 'c2', active), false);
});

test('admin hozzáfér, ismeretlen szerep nem', () => {
  assert.equal(hasRole({ id: 'a1', role: 'admin' }, ['coach']), true);
  assert.equal(hasRole({ id: 'x', role: 'guest' }, ['coach']), false);
  assert.equal(canAccessClient(null, 'c1'), false);
});
