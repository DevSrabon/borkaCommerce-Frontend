import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent browser & proxy from aggressively caching development chunks (fixes Turbopack stale chunk factory errors)
  headers: async () => {
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/:path*',
          headers: [
            {
              key: 'Cache-Control',
              value: 'no-cache, no-store, must-revalidate',
            },
          ],
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
