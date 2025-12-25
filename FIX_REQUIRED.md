# 🔧 Required Fixes

Based on the integration test results, you need to fix the following:

## 1. Chain ID Mismatch

**Issue**: Frontend expects Chain ID `5001` (Mantle Testnet), but Backend uses `11155111` (Mantle Sepolia)

**Fix**: Update one of them to match:

**Option A - Use Mantle Testnet (Recommended for development):**
```bash
# In event-vax/.env
VITE_EXPECTED_CHAIN_ID=5001

# In event-vax/server/.env
CHAIN_ID=5001
```

**Option B - Use Mantle Sepolia:**
```bash
# In event-vax/.env
VITE_EXPECTED_CHAIN_ID=11155111

# In event-vax/server/.env
CHAIN_ID=11155111
```

## 2. Missing Mantle Signer Configuration

**Issue**: `MANTLE_SIGNER_ADDRESS` and `MANTLE_PRIVATE_KEY` are not set in backend `.env`

**Fix**: Add these to `event-vax/server/.env`:

```bash
# Generate a new wallet for signing (or use an existing one)
# You can use this command to generate a wallet:
# node -e "const { ethers } = require('ethers'); const w = ethers.Wallet.createRandom(); console.log('Address:', w.address); console.log('Private Key:', w.privateKey);"

MANTLE_SIGNER_ADDRESS=0xYourSignerAddress
MANTLE_PRIVATE_KEY=0xYourPrivateKey
```

**Important**: 
- The `MANTLE_SIGNER_ADDRESS` must match the address used when deploying the contract
- If you deployed with a different signer, you need to either:
  - Use that address/private key, OR
  - Update the contract's signer using `setMantleSigner()` function

## Quick Fix Commands

```bash
# 1. Fix Chain ID (choose one network)
# For Mantle Testnet:
echo "VITE_EXPECTED_CHAIN_ID=5001" >> event-vax/.env
echo "CHAIN_ID=5001" >> event-vax/server/.env

# OR for Mantle Sepolia:
# echo "VITE_EXPECTED_CHAIN_ID=11155111" >> event-vax/.env
# echo "CHAIN_ID=11155111" >> event-vax/server/.env

# 2. Add Mantle Signer (replace with your actual values)
echo "MANTLE_SIGNER_ADDRESS=0xYourAddress" >> event-vax/server/.env
echo "MANTLE_PRIVATE_KEY=0xYourPrivateKey" >> event-vax/server/.env

# 3. Restart your server
# Then run the test again: ./test-connection.sh
```

## Verify Your Contract Signer

If your contract is already deployed, check what signer it's using:

```bash
# Using cast (from foundry) or ethers
# Get the current signer from the contract
cast call <AVARA_CORE_ADDRESS> "mantleSigner()" --rpc-url https://rpc.sepolia.mantle.xyz
```

Make sure the `MANTLE_SIGNER_ADDRESS` in your `.env` matches the contract's signer.

