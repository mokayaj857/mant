# Deployment Instructions

## ✅ Status: Contracts Compiled Successfully!

The smart contracts have been successfully compiled using Foundry. The contracts are ready for deployment.

## Quick Deploy

### Option 1: Deploy using Foundry (Recommended)

Since we compiled with Foundry, you can deploy directly using Foundry:

```bash
cd /home/junia-loves-juniour/code/joe/event-vax/krnl/avara

# Set your environment variables
export PRIVATE_KEY=0xYourPrivateKey
export SEPOLIA_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR-API-KEY
export KRNL_SIGNER=0xYourKrnlSignerAddress

# Deploy using Foundry
forge script scripts/Deploy.s.sol:DeployScript \
  --rpc-url $SEPOLIA_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify
```

### Option 2: Deploy using Hardhat (After fixing import resolution)

The contracts are compiled, but Hardhat has import resolution issues. To fix:

1. Copy Foundry artifacts to Hardhat format:
```bash
# The artifacts are in out/ directory from Foundry
# You may need to manually copy or convert them
```

2. Or fix the Hardhat compilation issue by ensuring all imports resolve correctly.

### Option 3: Manual Deployment via Remix or Etherscan

1. Copy the contract code to Remix IDE
2. Compile with Solidity 0.8.24
3. Deploy to Sepolia network
4. Use the constructor: `AvaraCore(address _krnlSigner)`

## Contract Addresses After Deployment

After deployment, you'll get:
- **AvaraCore**: Main contract address
- **POAPNFT**: Automatically deployed by AvaraCore constructor
- **TicketNFT**: Automatically deployed by AvaraCore constructor

## Environment Variables Required

Make sure your `.env` file has:
```env
SEPOLIA_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR-API-KEY
PRIVATE_KEY=0xYourPrivateKey
KRNL_SIGNER=0xYourKrnlSignerAddress
```

## Next Steps

1. Deploy the contracts
2. Save the deployment addresses
3. Update your frontend/backend with the new addresses
4. Test the contracts with sample transactions

## Troubleshooting

If you encounter issues:
- Ensure you have Sepolia ETH in your deployer wallet
- Verify your RPC URL is correct and accessible
- Check that your private key is properly formatted (with or without 0x prefix)





