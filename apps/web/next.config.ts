import type { NextConfig } from "next";
import { MEAL_PLANNER_ROUTE } from "./src/lib/app-routes";

const nextConfig: NextConfig = {
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
