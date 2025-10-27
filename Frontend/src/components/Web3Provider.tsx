"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { createConfig, http } from "wagmi";
import { injected, walletConnect } from "wagmi/connectors";
import { baseSepolia } from "@/lib/chains";
import { WalletConnectProvider } from "./WalletConnectProvider";

// Create a client
const queryClient = new QueryClient();

// Wagmi config with WalletConnect connectors
const config = createConfig({
  chains: [baseSepolia],
  connectors: [
    injected(),
    walletConnect({
      projectId:
        process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "your-project-id",
    }),
  ],
  transports: {
    [baseSepolia.id]: http(),
  },
});

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <WalletConnectProvider>{children}</WalletConnectProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
