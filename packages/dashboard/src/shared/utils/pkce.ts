// Converts ArrayBuffer to base64url (RFC 7636)
export function base64UrlEncode(str: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(str)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// Converts string to ArrayBuffer
export function stringToArrayBuffer(str: string): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(str);
}

// SHA256 hashing of a string
export async function sha256(str: string): Promise<ArrayBuffer> {
  const buffer = stringToArrayBuffer(str);
  return await getCrypto().subtle.digest("SHA-256", buffer as BufferSource);
}

// Retrieves window.crypto
export function getCrypto(): Crypto {
  return (
    (window.crypto as Crypto) ||
    (window as unknown as { msCrypto?: Crypto }).msCrypto!
  );
}

export function generateCodeVerifier(length = 64): string {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  let result = "";
  const randomValues = new Uint8Array(length);
  getCrypto().getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    result += charset[randomValues[i] % charset.length];
  }
  return result;
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const digest = await sha256(verifier);
  return base64UrlEncode(digest);
}
