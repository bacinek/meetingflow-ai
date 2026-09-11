import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Bundle unpdf into the Node server graph so Next does not try to
  // load it (or leftover pdf-parse) as an external ESM module.
  transpilePackages: ["unpdf"],
};

export default nextConfig;
