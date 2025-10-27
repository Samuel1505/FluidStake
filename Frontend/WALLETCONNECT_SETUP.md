# WalletConnect Setup Guide

This project has been migrated from RainbowKit to WalletConnect SDK and updated to use Base Sepolia testnet.

## Changes Made

### 1. Chain Configuration

- Updated from XFI Testnet to Base Sepolia
- Chain ID: 84532
- RPC URL: https://sepolia.base.org
- Block Explorer: https://sepolia.basescan.org

### 2. WalletConnect Integration

- Replaced RainbowKit with WalletConnect SDK
- Implemented Core and WalletKit initialization
- Added session management for wallet connections
- Created custom WalletConnect button component

### 3. Updated Components

- `Web3Provider.tsx` - Updated to use WalletConnect
- `Navbar.tsx` - Updated to use custom WalletConnect button
- `chains.ts` - Updated to Base Sepolia configuration
- Created new components:
  - `WalletConnectButton.tsx` - Custom wallet connection button
  - `WalletConnectProvider.tsx` - WalletConnect session management
  - `walletconnect.ts` - WalletConnect Core and WalletKit initialization

## Setup Instructions

### 1. Get WalletConnect Project ID

1. Go to [WalletConnect Dashboard](https://dashboard.reown.com)
2. Create a new project
3. Copy your project ID

### 2. Set Environment Variables

Create a `.env.local` file in the frontend directory:

```bash
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-project-id-here
```

Replace `your-project-id-here` with your actual WalletConnect project ID.

### 3. Install Dependencies

The following packages are already installed:

- `@reown/walletkit`
- `@walletconnect/core`
- `@walletconnect/utils`

### 4. Run the Application

```bash
npm run dev
```

## Features

### Wallet Connection

- Supports multiple wallet types through WalletConnect
- Session management with automatic reconnection
- Base Sepolia testnet integration

### Session Management

- Automatic session proposal handling
- Support for personal signing and transactions
- Proper session disconnect handling

### UI Components

- Custom wallet connect button
- Responsive design for mobile and desktop
- Dark theme integration

## Network Information

### Base Sepolia Testnet

- **Chain ID**: 84532
- **Currency**: ETH
- **RPC URL**: https://sepolia.base.org
- **Block Explorer**: https://sepolia.basescan.org
- **Faucet**: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet

## Troubleshooting

### Common Issues

1. **WalletConnect Project ID not set**: Make sure to set the environment variable
2. **Connection issues**: Check that your wallet supports WalletConnect
3. **Network issues**: Ensure you're connected to Base Sepolia testnet

### Debug Mode

Enable debug mode by adding to your environment variables:

```bash
NEXT_PUBLIC_DEBUG=true
```

This will log detailed information about WalletConnect sessions and requests.
