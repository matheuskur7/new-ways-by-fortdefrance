import assert from 'node:assert/strict';
import test from 'node:test';
import { avatarFileSchema, passwordSchema, profileSchema } from '../src/api/user-settings/schemas.ts';

test('profile requires a nonempty name and trims whitespace', () => {
  assert.equal(profileSchema.parse({ name: ' Alice ' }).name, 'Alice');
  assert.equal(profileSchema.safeParse({ name: ' ' }).success, false);
});
test('password changes require current password and matching new passwords', () => {
  const values = { currentPassword: 'old-password', newPassword: 'new-password', confirmPassword: 'new-password' };
  assert.equal(passwordSchema.safeParse(values).success, true);
  for (const change of [{ currentPassword: '' }, { confirmPassword: 'wrong' }, { newPassword: 'short', confirmPassword: 'short' }, { newPassword: 'old-password', confirmPassword: 'old-password' }]) {
    assert.equal(passwordSchema.safeParse({ ...values, ...change }).success, false);
  }
});
test('avatar selection rejects unsupported types and oversized files', () => {
  assert.equal(avatarFileSchema.safeParse(new File(['photo'], 'photo.png', { type: 'image/png' })).success, true);
  assert.equal(avatarFileSchema.safeParse(new File(['svg'], 'photo.svg', { type: 'image/svg+xml' })).success, false);
  assert.equal(avatarFileSchema.safeParse(new File([new Uint8Array(11 * 1024 * 1024)], 'photo.jpg', { type: 'image/jpeg' })).success, false);
});
