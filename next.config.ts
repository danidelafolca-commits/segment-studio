import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Embedded in exports for traceability (which app version produced the data).
  env: {
    NEXT_PUBLIC_APP_COMMIT: (process.env.VERCEL_GIT_COMMIT_SHA ?? "dev").slice(0, 7),
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
  images: {
    // The hero background + segmentation graphic in /public are first-party SVGs
    // that we author ourselves. Allowing SVG through next/image's optimizer is
    // safe here because the CSP + attachment disposition neutralise any scripting.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
