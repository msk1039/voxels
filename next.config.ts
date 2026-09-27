import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  turbopack: {
    root: process.cwd(),
  },
  allowedDevOrigins: ['10.241.131.66'],
};

export default nextConfig;
