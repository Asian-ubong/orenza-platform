import assert from 'node:assert/strict';

const canSubscribe = (principal, channel) => {
  if (!principal.privateAccessActive) return false;
  if (channel.kind === 'user') return principal.role !== 'WORKER' && principal.userId === channel.userId;
  if (channel.kind === 'admin') return principal.role === 'OWNER' || principal.role === 'ADMIN';
  if (channel.kind === 'provider' || channel.kind === 'system') return principal.role === 'WORKER';
  return false;
};

const user = { userId: 'u-1', role: 'USER', privateAccessActive: true };
const admin = { userId: 'u-admin', role: 'ADMIN', privateAccessActive: true };
const worker = { role: 'WORKER', privateAccessActive: true };
const revoked = { userId: 'u-1', role: 'USER', privateAccessActive: false };

assert.equal(canSubscribe(user, { kind: 'user', userId: 'u-1' }), true);
assert.equal(canSubscribe(user, { kind: 'user', userId: 'u-2' }), false);
assert.equal(canSubscribe(user, { kind: 'admin' }), false);
assert.equal(canSubscribe(admin, { kind: 'admin' }), true);
assert.equal(canSubscribe(admin, { kind: 'user', userId: 'u-1' }), false);
assert.equal(canSubscribe(worker, { kind: 'provider', provider: 'DERIV', connectionId: 'c-1' }), true);
assert.equal(canSubscribe(user, { kind: 'provider', provider: 'DERIV', connectionId: 'c-1' }), false);
assert.equal(canSubscribe(revoked, { kind: 'user', userId: 'u-1' }), false);

console.log('Realtime boundary authorization tests passed.');
