import * as fs from "fs";
import * as path from "path";
import { generateKeyPair, exportJWK } from "jose";

export interface JWKSKeys {
  keys: any[];
}

/**
 * Generates a new JWKS and saves it to a file.
 */
async function generateJwks(): Promise<JWKSKeys> {
  try {
    // Generate an RSA signing key
    const { privateKey, publicKey } = await generateKeyPair("RS256", {
      modulusLength: 2048,
    });

    // Export keys to JWK format
    const privateJwk = await exportJWK(privateKey);
    const publicJwk = await exportJWK(publicKey);

    // Add the necessary parameters
    privateJwk.alg = "RS256";
    privateJwk.use = "sig";
    privateJwk.kid = generateKeyId();

    publicJwk.alg = "RS256";
    publicJwk.use = "sig";
    publicJwk.kid = privateJwk.kid;

    const jwks: JWKSKeys = {
      keys: [privateJwk],
    };

    // Create a directory
    const jwksDir = path.join(process.cwd(), "jwks");
    if (!fs.existsSync(jwksDir)) {
      fs.mkdirSync(jwksDir, { recursive: true });
    }

    // Write to a file
    const jwksPath = path.join(jwksDir, "jwks.json");
    fs.writeFileSync(jwksPath, JSON.stringify(jwks, null, 2));
    console.info("JWKS generated and saved to", jwksPath);

    return jwks;
  } catch (error) {
    console.error("Failed to generate JWKS:", error);
    throw error;
  }
}

/**
 * Loads a JWKS from a file synchronously.
 */
function loadJwksSync(): JWKSKeys | null {
  try {
    const jwksPath = path.join(process.cwd(), "jwks", "jwks.json");
    const jwksData = fs.readFileSync(jwksPath, "utf8");
    return JSON.parse(jwksData);
  } catch (error) {
    if (error instanceof Error) {
      console.warn("Failed to load JWKS from file:", error.message);
    } else {
      console.warn("Failed to load JWKS from file:", error);
    }
    return null;
  }
}

/**
 * Checks for the presence of the JWKS file. If the file exists, it loads it,
 * if not, it generates a new key set and saves it to a file.
 */
async function getJwks(): Promise<JWKSKeys> {
  const jwksPath = path.join(process.cwd(), "jwks", "jwks.json");

  if (fs.existsSync(jwksPath)) {
    const jwks = loadJwksSync();
    if (jwks && jwks.keys && jwks.keys.length > 0) {
      console.info("JWKS loaded from file");
      return jwks;
    }
  }

  console.warn("JWKS file not found or empty, generating a new one");
  return await generateJwks();
}

/**
 * Generates a unique key identifier
 */
function generateKeyId(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

/**
 * Returns the public keys for the JWKS endpoint
 */
export function getPublicJwks(jwks: JWKSKeys): JWKSKeys {
  const publicKeys = jwks.keys.map((key) => {
    const { d, p, q, dp, dq, qi, ...publicKey } = key;
    return publicKey;
  });

  return { keys: publicKeys };
}

export { getJwks, loadJwksSync, generateJwks };
