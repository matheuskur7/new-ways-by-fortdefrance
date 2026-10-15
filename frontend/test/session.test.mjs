import assert from 'node:assert/strict';
import test from 'node:test';
import { notifySessionExpired, SESSION_EXPIRED_EVENT, setSigningOut } from '../src/api/session.ts';

test('session expiration is suppressed during voluntary logout and restored afterward', () => {
  const previousWindow = globalThis.window;
  const target = new EventTarget();
  let notifications = 0;
  target.addEventListener(SESSION_EXPIRED_EVENT, () => notifications++);
  globalThis.window = target;
  try {
    notifySessionExpired();
    assert.equal(notifications, 1);
    setSigningOut(true);
    notifySessionExpired();
    assert.equal(notifications, 1);
    setSigningOut(false);
    notifySessionExpired();
    assert.equal(notifications, 2);
  } finally {
    setSigningOut(false);
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
});

test('expiration signals require a fresh server confirmation', async () => {
  const { confirmSessionExpired } = await import('../src/api/session.ts');
  assert.equal(await confirmSessionExpired(async () => ({ data: { user: { id: 'current-user' } }, error: null })), false);
  assert.equal(await confirmSessionExpired(async () => ({ data: null, error: null })), true);
  assert.equal(await confirmSessionExpired(async () => ({ data: null, error: { status: 401 } })), true);
  assert.equal(await confirmSessionExpired(async () => ({ data: null, error: { status: 500 } })), false);
  assert.equal(await confirmSessionExpired(async () => ({ data: null, error: { status: 429 } })), false);
  assert.equal(await confirmSessionExpired(async () => { throw new Error('Network unavailable'); }), false);
});

test('voluntary logout suppresses checks and any pending expiration confirmation', async () => {
  const { confirmSessionExpired } = await import('../src/api/session.ts');
  try {
    setSigningOut(true);
    assert.equal(await confirmSessionExpired(async () => { throw new Error('Must not request'); }), false);
    setSigningOut(false);
    let resolve;
    const pending = confirmSessionExpired(() => new Promise((finish) => { resolve = finish; }));
    setSigningOut(true);
    resolve({ data: null, error: null });
    assert.equal(await pending, false);
  } finally { setSigningOut(false); }
});
