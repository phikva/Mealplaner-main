import type { NextConfig } from "next";
import { MEAL_PLANNER_ROUTE } from "./src/lib/app-routes";

const nextConfig: NextConfig = {
  experimental: {
    // Next 15+ caches ikke dynamiske sider i router cache som standard (0s).
    // Gjeninnfør kort cache slik at tilbakenavigasjon og gjentatt navigasjon er instant.
    staleTimes: {
      dynamic: 30,
      static: 300,
    },
  },
  async redirects() {
    return [
      { source: "/login", destination: "/logg-inn", permanent: true },
      { source: "/register", destination: "/registrering", permanent: true },
      { source: "/plan", destination: MEAL_PLANNER_ROUTE.path, permanent: true },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
    ],
  },
};

export default nextConfig;
