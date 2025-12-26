# 🔧 Issues to Fix

Based on the test results, here are the issues that need to be fixed:

## Issue 1: Chain ID Mismatch ⚠️

**Problem**: 
- Frontend expects: `5003`
- Backend .env has: `5003`
- But contract config shows: `11155111` (Mantle Sepolia)

**This means**: Your contracts are deployed on Mantle Sepolia (11155111), but your configuration is set to 5003.

**Fix**: Update both frontend and backend to use `11155111`:

```bash
# Frontend .env
VITE_EXPECTED_CHAIN_ID=11155111

# Backend .env  
CHAIN_ID=11155111
```

## Issue 2: MANTLE_SIGNER_ADDRESS Not Set ❌

**Problem**: `MANTLE_SIGNER_ADDRESS` is not configured in backend `.env`

**Fix**: Add to `event-vax/server/.env`:

```bash
MANTLE_SIGNER_ADDRESS=0xYourSignerAddress
```

**Important**: This must match the signer address used when deploying the contract. Check your contract:

```bash
# Get the current signer from the contract
cast call 0x5F9F8883C67d68B79a5779339a48237B9A3325EB "mantleSigner()" --rpc-url https://rpc.sepolia.mantle.xyz
```

## Issue 3: MANTLE_PRIVATE_KEY Format ⚠️

**Problem**: `MANTLE_PRIVATE_KEY` exists but doesn't start with `0x`

**Fix**: Ensure the private key starts with `0x`:

```bash
# In server/.env
MANTLE_PRIVATE_KEY=0xYourPrivateKey
```

## Issue 4: Contract Addresses Not in Frontend .env

**Status**: This is OK - the frontend will fetch addresses from the server API.

However, you can optionally add them to frontend `.env` for better performance:

```bash
VITE_AVARA_CORE_ADDRESS=0x5F9F8883C67d68B79a5779339a48237B9A3325EB
VITE_TICKET_NFT_ADDRESS=0xbb2853a001A47a25f5f0392A5E7cDBFa90448945
VITE_POAP_NFT_ADDRESS=0x7d552D09B4468583CaFda67d3057E62711CF7131
```

## Quick Fix Commands

```bash
# 1. Fix Chain IDs (use 11155111 - Mantle Sepolia where contracts are deployed)
cd /home/junia-loves-juniour/code/joe/event-vax

# Update frontend
sed -i 's/VITE_EXPECTED_CHAIN_ID=.*/VITE_EXPECTED_CHAIN_ID=11155111/' .env 2>/dev/null || echo "VITE_EXPECTED_CHAIN_ID=11155111" >> .env

# Update backend
cd server
sed -i 's/CHAIN_ID=.*/CHAIN_ID=11155111/' .env 2>/dev/null || echo "CHAIN_ID=11155111" >> .env

# 2. Add Mantle Signer (replace with actual values)
# First, check what signer the contract is using:
# cast call 0x5F9F8883C67d68B79a5779339a48237B9A3325EB "mantleSigner()" --rpc-url https://rpc.sepolia.mantle.xyz

# Then add to server/.env:
echo "MANTLE_SIGNER_ADDRESS=0xYourActualSignerAddress" >> .env
echo "MANTLE_PRIVATE_KEY=0xYourActualPrivateKey" >> .env

# 3. Fix private key format if needed
sed -i 's/^MANTLE_PRIVATE_KEY=/MANTLE_PRIVATE_KEY=0x/' .env

# 4. Restart backend server
# Then run test again: cd .. && ./test-connection.sh
```

## After Fixing

1. Restart your backend server
2. Refresh your frontend (or restart dev server)
3. Run the test: `./test-connection.sh`
4. All tests should pass! ✅


