import "server-only";

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function generateResetToken(): Promise<{ token: string; tokenHash: string }> {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const token = toHex(bytes);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  const tokenHash = toHex(new Uint8Array(digest));
  return { token, tokenHash };
}

/** Constant-time compare: hash the provided token and check against the stored hash. */
export async function verifyResetToken(token: string, expectedHashHex: string): Promise<boolean> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  const hashHex = toHex(new Uint8Array(digest));
  let out = 0;
  for (let i = 0; i < expectedHashHex.length; i++) {
    out |= (hashHex.charCodeAt(i) ^ expectedHashHex.charCodeAt(i)) & 0xff;
  }
  return out === 0 && hashHex.length === expectedHashHex.length;
}
