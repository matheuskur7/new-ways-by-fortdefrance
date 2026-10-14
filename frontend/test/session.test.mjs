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
