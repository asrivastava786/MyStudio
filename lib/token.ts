// import "server-only";
// import crypto from "crypto";


// export function generateResetToken() {
// const token = crypto.randomBytes(32).toString("hex");
// const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
// return { token, tokenHash };
// }

// lib/token.ts
import "server-only";

/**
 * Convert a byte array to a lowercase hex string.
 */
function bytesToHex(bytes: Uint8Array): string {
  const out = new Array<string>(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    out[i] = bytes[i].toString(16).padStart(2, "0");
  }
  return out.join("");
}

/**
 * SHA-256 hash to hex using Web Crypto (Edge + modern Node).
 */
async function sha256Hex(input: string): Promise<string> {
  // TextEncoder is available on Edge and Node 18+
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return bytesToHex(new Uint8Array(digest));
}

/**
 * Secure random bytes to hex using Web Crypto (Edge + modern Node).
 * @param size number of random bytes (default 32 -> 64 hex chars)
 */
function randomBytesHex(size = 32): string {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

/**
 * Generate a reset token and its SHA-256 hash (hex).
 * Works on Edge and Node without importing 'crypto'.
 */
// export async function generateResetToken(size = 32): Promise<{
//   token: string;
//   tokenHash: string;
// }> {
//   const token = randomBytesHex(size);
//   const tokenHash = await sha256Hex(token);
//   return { token, tokenHash };
// }
const toHex = (bytes: Uint8Array) =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
export async function generateResetToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const token = toHex(bytes);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  const tokenHash = toHex(new Uint8Array(digest));
  return { token, tokenHash };
}
/**
 * Constant-time verify helper: hash the provided token and compare to stored hash.
 */
export async function verifyResetToken(
  token: string,
  expectedHashHex: string
): Promise<boolean> {
  const hashHex = await sha256Hex(token);

  // Constant-time-ish comparison (length is fixed: 64 hex chars for SHA-256)
  let out = 0;
  for (let i = 0; i < expectedHashHex.length; i++) {
    out |= (hashHex.charCodeAt(i) ^ expectedHashHex.charCodeAt(i)) & 0xff;
  }
  return out === 0 && hashHex.length === expectedHashHex.length;
}
