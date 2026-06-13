import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  // Prevent Turbopack from bundling Node.js-only packages that use CJS internals.
  // Without this, ESM→CJS interop in dev mode produces
  // "Function.prototype.apply was called on #<Object>" at runtime.
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/extension-accelerate",
    "nodemailer",
    "bcryptjs",
  ],
};

export default nextConfig;
