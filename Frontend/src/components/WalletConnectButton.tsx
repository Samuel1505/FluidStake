"use client";

import { useState, useEffect } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected, walletConnect } from "wagmi/connectors";
import { walletKit } from "@/lib/walletconnect";

export function WalletConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const [isWalletKitReady, setIsWalletKitReady] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);

  useEffect(() => {
    // Initialize WalletKit
    const initWalletKit = async () => {
      try {
        await walletKit;
        setIsWalletKitReady(true);
      } catch (error) {
        console.error("Failed to initialize WalletKit:", error);
      }
    };

    initWalletKit();
  }, []);

  const handleConnect = () => {
    if (isConnected) {
      disconnect();
    } else {
      setShowWalletModal(true);
    }
  };

  const handleWalletSelect = (connectorType: "injected" | "walletconnect") => {
    setShowWalletModal(false);
    if (connectorType === "injected") {
      connect({ connector: injected() });
    } else if (connectorType === "walletconnect") {
      connect({
        connector: walletConnect({
          projectId:
            process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ||
            "your-project-id",
        }),
      });
    }
  };

  if (isConnected) {
    return (
      <button
        onClick={handleConnect}
        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
      >
        {address
          ? `${address.slice(0, 6)}...${address.slice(-4)}`
          : "Connected"}
      </button>
    );
  }

  return (
    <>
      <button
        onClick={handleConnect}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        disabled={!isWalletKitReady}
      >
        {isWalletKitReady ? "Connect Wallet" : "Loading..."}
      </button>

      {/* Wallet Selection Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md mx-4 border border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Connect Wallet</h3>
              <button
                onClick={() => setShowWalletModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* MetaMask / Browser Extension */}
              <button
                onClick={() => handleWalletSelect("injected")}
                className="w-full flex items-center p-4 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors border border-gray-600"
              >
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mr-4">
                  <svg
                    className="w-6 h-6 text-white"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-medium text-white">MetaMask</div>
                  <div className="text-sm text-gray-400">
                    Connect using browser extension
                  </div>
                </div>
              </button>

              {/* WalletConnect */}
              <button
                onClick={() => handleWalletSelect("walletconnect")}
                className="w-full flex items-center p-4 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors border border-gray-600"
              >
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mr-4">
                  <svg
                    className="w-6 h-6 text-white"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-medium text-white">WalletConnect</div>
                  <div className="text-sm text-gray-400">
                    Connect using QR code or mobile wallet
                  </div>
                </div>
              </button>

              {/* Additional wallets can be added here */}
              <div className="text-center text-sm text-gray-500 mt-4">
                More wallets coming soon...
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
