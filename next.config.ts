import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/page/:slug",
        destination: "/pages/:slug",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
