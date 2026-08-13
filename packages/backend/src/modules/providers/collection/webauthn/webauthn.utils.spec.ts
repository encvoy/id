import { resolveWebAuthnOrigin } from './webauthn.utils';

describe('resolveWebAuthnOrigin', () => {
  it.each([
    ['https://local.trusted.plus/id', 'https://local.trusted.plus'],
    ['https://local.trusted.plus', 'https://local.trusted.plus'],
    ['https://localhost:3007/id', 'https://localhost:3007'],
  ])('resolves WebAuthn origin from %s', (publicUrl, expectedOrigin) => {
    expect(resolveWebAuthnOrigin(publicUrl)).toBe(expectedOrigin);
  });
});
