import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["starknet", "@starknet-react/core", "@starknet-react/chains"],
};

export default nextConfig;
