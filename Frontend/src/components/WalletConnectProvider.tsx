"use client";

import { useEffect, useState } from "react";
import { walletKit } from "@/lib/walletconnect";
import { buildApprovedNamespaces, getSdkError } from "@walletconnect/utils";

export function WalletConnectProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeWalletConnect = async () => {
      try {
        // Wait for WalletKit to be initialized
        await walletKit;

        // Handle session proposals
        walletKit.on("session_proposal", async ({ id, params }) => {
          try {
            const approvedNamespaces = buildApprovedNamespaces({
              proposal: params,
              supportedNamespaces: {
                eip155: {
                  chains: ["eip155:84532"], // Base Sepolia
                  methods: [
                    "eth_accounts",
                    "eth_requestAccounts",
                    "eth_sendRawTransaction",
                    "eth_sign",
                    "eth_signTransaction",
                    "eth_signTypedData",
                    "eth_signTypedData_v3",
                    "eth_signTypedData_v4",
                    "eth_sendTransaction",
                    "personal_sign",
                    "wallet_switchEthereumChain",
                    "wallet_addEthereumChain",
                  ],
                  events: [
                    "chainChanged",
                    "accountsChanged",
                    "message",
                    "disconnect",
                    "connect",
                  ],
                  accounts: [
                    // Add user accounts here when available
                  ],
                },
              },
            });

            const session = await walletKit.approveSession({
              id,
              namespaces: approvedNamespaces,
            });

            console.log("Session approved:", session);
          } catch (error) {
            console.error("Failed to approve session:", error);
            await walletKit.rejectSession({
              id,
              reason: getSdkError("USER_REJECTED"),
            });
          }
        });

        // Handle session requests
        walletKit.on("session_request", async (event) => {
          const { topic, params, id } = event;
          const { request } = params;

          try {
            // Handle different request types
            if (request.method === "personal_sign") {
              // Handle personal sign requests
              const message = request.params[0];
              // Implement signing logic here
              console.log("Personal sign request:", message);
            } else if (request.method === "eth_sendTransaction") {
              // Handle transaction requests
              const transaction = request.params[0];
              // Implement transaction logic here
              console.log("Transaction request:", transaction);
            }

            // For now, we'll just log the request
            console.log("Session request:", request);
          } catch (error) {
            console.error("Failed to handle session request:", error);
          }
        });

        // Handle session disconnect
        walletKit.on("session_delete", (event) => {
          console.log("Session disconnected:", event);
        });

        setIsInitialized(true);
      } catch (error) {
        console.error("Failed to initialize WalletConnect:", error);
      }
    };

    initializeWalletConnect();
  }, []);

  return <>{children}</>;
}
