import { Core } from "@walletconnect/core";
import { WalletKit } from "@reown/walletkit";

// Initialize WalletConnect Core
const core = new Core({
  projectId:
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "your-project-id",
});

// Initialize WalletKit
export const walletKit = WalletKit.init({
  core, // <- pass the shared `core` instance
  metadata: {
    name: "Stake & Bake",
    description: "Stake & Bake NFT Staking Platform",
    url: "https://stakeandbake.com",
    icons: ["/logo.png"],
  },
});

export { core };
