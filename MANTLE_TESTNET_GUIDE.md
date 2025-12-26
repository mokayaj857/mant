# Mantle Testnet Chain ID Guide

## Available Mantle Testnets

### Option 1: Mantle Testnet (Recommended for Development)
- **Chain ID**: `5001`
- **Network Name**: Mantle Testnet
- **RPC URL**: `https://rpc.testnet.mantle.xyz`
- **Block Explorer**: `https://explorer.testnet.mantle.xyz`
- **Currency**: MNT (Mantle Token)
- **Best for**: General development and testing

### Option 2: Mantle Sepolia
- **Chain ID**: `11155111`
- **Network Name**: Mantle Sepolia
- **RPC URL**: `https://rpc.sepolia.mantle.xyz`
- **Block Explorer**: `https://explorer.sepolia.mantle.xyz`
- **Currency**: ETH
- **Best for**: Testing with Ethereum Sepolia compatibility

### Option 3: Mantle Sepolia Testnet (Alternative)
- **Chain ID**: `5003`
- **Network Name**: Mantle Sepolia Testnet
- **RPC URL**: `https://rpc.sepolia.mantle.xyz` (or check Mantle docs)
- **Best for**: Specific Sepolia-based testing

## 🎯 Recommendation

**Use Chain ID `5001` (Mantle Testnet)** - This is the official Mantle testnet and is the most stable for development.

## Configuration

### Frontend `.env`:
```bash
VITE_EXPECTED_CHAIN_ID=5001
```

### Backend `server/.env`:
```bash
CHAIN_ID=5001
```

## Your Current Situation

Your contracts are currently deployed on **Chain ID 11155111** (Mantle Sepolia). You have two options:

### Option A: Keep using Mantle Sepolia (11155111)
- Your contracts are already there
- Just update your config to use 11155111 consistently

### Option B: Deploy to Mantle Testnet (5001) - Recommended
- Deploy new contracts to Mantle Testnet
- Use Chain ID 5001 everywhere
- More stable for development

## Quick Setup for Mantle Testnet (5001)

```bash
# Frontend .env
VITE_EXPECTED_CHAIN_ID=5001

# Backend server/.env
CHAIN_ID=5001

# Deploy contracts to Mantle Testnet
cd mantle/avara
export NETWORK=mantleTestnet
export MANTLE_TESTNET_RPC_URL=https://rpc.testnet.mantle.xyz
npx hardhat run scripts/deploy.ts --network mantleTestnet
```

## Deploying to Mantle Testnet

```bash
cd event-vax/mantle/avara

# Set environment variables
export NETWORK=mantleTestnet
export PRIVATE_KEY=0xYourPrivateKey
export MANTLE_TESTNET_RPC_URL=https://rpc.testnet.mantle.xyz
export MANTLE_SIGNER=0xYourMantleSignerAddress

# Deploy
npx hardhat run scripts/deploy.ts --network mantleTestnet
```

After deployment, update your backend `.env` with the new contract addresses.

