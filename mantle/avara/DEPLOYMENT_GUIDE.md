# Avara Smart Contracts Deployment Guide

## Overview
This guide will help you deploy the Avara smart contracts (AvaraCore, POAPNFT, TicketNFT) to the Sepolia testnet.

## Prerequisites
1. Node.js 22.10.0 or later (currently using 20.19.4 which may cause issues)
2. A wallet with Sepolia ETH for gas fees
3. Environment variables configured in `.env` file

## Environment Setup

Create or update your `.env` file with the following variables:

```env
# Network RPC URLs
SEPOLIA_URL=https://sepolia.infura.io/v3/YOUR-PROJECT-ID
# OR use Alchemy:
# SEPOLIA_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR-API-KEY

# Private key of the deployer account (with or without 0x prefix)
PRIVATE_KEY=0xYourPrivateKeyHere

# KRNL signer address (can be the same as deployer for testing)
KRNL_SIGNER=0xYourKrnlSignerAddress

# Optional: Etherscan API key for contract verification
ETHERSCAN_API_KEY=YourEtherscanApiKey
```

## Known Issues

### Hardhat 3 Compilation Error
There's currently a known issue with Hardhat 3 and the dependency graph that causes:
```
TypeError: this[#dependenciesMap].values(...).flatMap is not a function
```

**Workarounds:**

1. **Use Foundry for Compilation** (Recommended):
   ```bash
   # Install Foundry if not already installed
   curl -L https://foundry.paradigm.xyz | bash
   foundryup
   
   # Compile with Foundry
   forge build
   
   # Then use Hardhat for deployment
   npx hardhat run scripts/deploy.ts --network sepolia
   ```

2. **Upgrade Node.js**:
   ```bash
   # Upgrade to Node.js 22.10.0 or later
   nvm install 22
   nvm use 22
   npm install
   npx hardhat compile
   ```

3. **Manual Compilation**:
   If the above don't work, you can manually compile using solc or use an online compiler, then place the artifacts in the `artifacts/contracts/` directory.

## Deployment Steps

### Step 1: Verify Environment Variables
```bash
cd /home/junia-loves-juniour/code/joe/event-vax/krnl/avara
# Check that your .env file has the required variables
cat .env | grep -E "(SEPOLIA_URL|PRIVATE_KEY|KRNL_SIGNER)"
```

### Step 2: Compile Contracts
```bash
# Try Hardhat compilation first
npx hardhat compile

# If that fails, use Foundry (see workarounds above)
# forge build
```

### Step 3: Deploy Contracts
```bash
# Deploy to Sepolia testnet
npx hardhat run scripts/deploy.ts --network sepolia
```

The deployment script will:
1. Deploy AvaraCore contract (which automatically deploys POAPNFT and TicketNFT)
2. Set up ownership relationships
3. Display deployment addresses and information

### Step 4: Verify Deployment
After deployment, you'll see output like:
```json
{
  "network": "sepolia",
  "chainId": "11155111",
  "deployer": "0x...",
  "contracts": {
    "AvaraCore": "0x...",
    "POAPNFT": "0x...",
    "TicketNFT": "0x...",
    "KRNL_SIGNER": "0x..."
  },
  "timestamp": "..."
}
```

### Step 5: Verify Contracts on Etherscan (Optional)
```bash
npx hardhat verify --network sepolia <AvaraCore_Address> <KRNL_SIGNER_ADDRESS>
```

## Contract Architecture

- **AvaraCore**: Main contract that orchestrates ticket and POAP operations
- **POAPNFT**: ERC721 contract for Proof of Attendance Protocol badges (can be soulbound)
- **TicketNFT**: ERC721 contract for event tickets with provenance tracking

The AvaraCore constructor automatically deploys both NFT contracts and sets up ownership.

## Troubleshooting

### Issue: "Insufficient funds"
- Ensure your deployer wallet has enough Sepolia ETH
- Get testnet ETH from a faucet: https://sepoliafaucet.com/

### Issue: "Invalid private key"
- Ensure PRIVATE_KEY in .env is a valid hex string (64 characters, with or without 0x prefix)
- The script will automatically add 0x prefix if missing

### Issue: "Network error"
- Check your SEPOLIA_URL is correct and accessible
- Try using a different RPC provider (Infura, Alchemy, etc.)

### Issue: Compilation fails
- See "Known Issues" section above for workarounds
- Try upgrading Node.js to version 22+
- Consider using Foundry for compilation

## Next Steps

After successful deployment:
1. Save the deployment addresses
2. Update your frontend/backend to use the new contract addresses
3. Test the contracts with sample transactions
4. Set up event rules using `setEventRules()` function
5. Configure KRNL integration for signature verification

## Support

For issues specific to:
- Hardhat: https://hardhat.org/docs
- KRNL Integration: Refer to KRNL documentation
- Contract functionality: Review contract source code in `contracts/` directory





