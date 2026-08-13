export const resolveWebAuthnOrigin = (publicUrl: string): string => new URL(publicUrl).origin;
