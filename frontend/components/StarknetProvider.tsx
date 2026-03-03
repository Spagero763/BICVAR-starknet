"use client";

import { ReactNode } from "react";
import { sepolia } from "@starknet-react/chains";
import { StarknetConfig, jsonRpcProvider, argent, braavos } from "@starknet-react/core";

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://api.cartridge.gg/x/starknet/sepolia";

const chains = [sepolia];
const connectors = [argent(), braavos()];

function rpc() {
  return { nodeUrl: RPC_URL };
}

export function StarknetProvider({ children }: { children: ReactNode }) {
  return (
    <StarknetConfig
      chains={chains}
      provider={jsonRpcProvider({ rpc })}
      connectors={connectors}
      autoConnect
    >
      {children}
    </StarknetConfig>
  );
}
