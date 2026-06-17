import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
