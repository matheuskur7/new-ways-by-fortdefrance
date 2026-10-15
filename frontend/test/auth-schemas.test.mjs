import assert from 'node:assert/strict';
import test from 'node:test';
import { signUpSchema, signInSchema, organizationSchema, authContextSchema } from '../src/lib/auth-schemas.ts';

test('signup normalizes names and emails without trimming passwords', () => {
  const input = signUpSchema.parse({ name: '  Test User  ', email: '  test@example.com  ', password: ' password ' });
  assert.equal(input.name, 'Test User');
  assert.equal(input.email, 'test@example.com');
  assert.equal(input.password, ' password ');
});
test('signup rejects invalid email, empty names and short passwords', () => {
  for (const values of [{ name: ' ', email: 'test@example.com', password: 'password' }, { name: 'Test', email: 'invalid', password: 'password' }, { name: 'Test', email: 'test@example.com', password: 'short' }]) {
    assert.equal(signUpSchema.safeParse(values).success, false);
  }
});
test('login requires credentials', () => {
  assert.equal(signInSchema.safeParse({ email: 'test@example.com', password: '' }).success, false);
});
test('organization creation rejects invalid identifiers', () => {
  for (const slug of ['../company', 'Company', 'company name', '-company', 'company-']) {
    assert.equal(organizationSchema.safeParse({ name: 'Company', slug }).success, false);
  }
  assert.equal(organizationSchema.safeParse({ name: 'Company', slug: 'my-company' }).success, true);
});
test('auth context validates backend data and permits onboarding without an organization', () => {
  assert.equal(authContextSchema.safeParse({ user: { id: 'user-1', name: 'Test', email: 'test@example.com' }, organization: null }).success, true);
  assert.equal(authContextSchema.safeParse({ user: { id: 'user-1' } }).success, false);
});

test('email recovery validates email and ignores injected redirect destinations', async () => {
  const { emailRequestSchema } = await import('../src/lib/auth-schemas.ts');
  assert.deepEqual(emailRequestSchema.parse({ email: ' user@example.com ', redirectTo: 'https://attacker.example' }), { email: 'user@example.com' });
  assert.equal(emailRequestSchema.safeParse({ email: 'invalid' }).success, false);
});

test('password reset requires a token, matching passwords and the shared password policy', async () => {
  const { resetPasswordSchema } = await import('../src/lib/auth-schemas.ts');
  const valid = { token: 'signed-token', newPassword: ' password ', confirmPassword: ' password ' };
  assert.equal(resetPasswordSchema.parse(valid).newPassword, ' password ');
  for (const patch of [{ token: '' }, { token: 'x'.repeat(2049) }, { newPassword: 'short', confirmPassword: 'short' }, { confirmPassword: 'different' }, { newPassword: 'a'.repeat(129), confirmPassword: 'a'.repeat(129) }]) {
    assert.equal(resetPasswordSchema.safeParse({ ...valid, ...patch }).success, false);
  }
});
