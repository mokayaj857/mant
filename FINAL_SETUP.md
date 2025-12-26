# 🎯 Final Setup Steps

## Current Status

✅ Backend server running  
✅ Frontend dev server running  
✅ Contracts deployed on Mantle Sepolia (11155111)  
❌ Chain ID mismatch (config: 5003, contracts: 11155111)  
❌ Mantle signer not configured  

## Step 1: Fix Chain ID

Your contracts are deployed on **Mantle Sepolia (Chain ID: 11155111)**, but your config uses 5003.

**Update both files:**

```bash
# Frontend .env
VITE_EXPECTED_CHAIN_ID=11155111

# Backend server/.env
CHAIN_ID=11155111
```

## Step 2: Configure Mantle Signer

You need to add the Mantle signer that was used when deploying the contract.

**Option A: If you know the signer address from deployment**

Add to `server/.env`:
```bash
MANTLE_SIGNER_ADDRESS=0xYourDeploymentSignerAddress
MANTLE_PRIVATE_KEY=0xYourDeploymentPrivateKey
```

**Option B: Check the contract's current signer**

```bash
# Using cast (if available)
cd mantle/avara
cast call 0x5F9F8883C67d68B79a5779339a48237B9A3325EB "mantleSigner()" --rpc-url https://rpc.sepolia.mantle.xyz

# Or use this Node.js script:
node -e "
const { ethers } = require('ethers');
const provider = new ethers.JsonRpcProvider('https://rpc.sepolia.mantle.xyz');
const abi = ['function mantleSigner() view returns (address)'];
const contract = new ethers.Contract('0x5F9F8883C67d68B79a5779339a48237B9A3325EB', abi, provider);
contract.mantleSigner().then(addr => console.log('Current signer:', addr));
"
```

**Option C: Update contract signer (if needed)**

If you want to use a different signer, you can update the contract:

```bash
# Using cast
cast send 0x5F9F8883C67d68B79a5779339a48237B9A3325EB "setMantleSigner(address)" 0xYourNewSignerAddress --rpc-url https://rpc.sepolia.mantle.xyz --private-key 0xYourOwnerPrivateKey
```

## Step 3: Verify Setup

After making changes:

1. **Restart backend server**
2. **Run test**: `./test-connection.sh`
3. **All tests should pass** ✅

## Quick Fix Script

```bash
cd /home/junia-loves-juniour/code/joe/event-vax

# Fix chain IDs
echo "VITE_EXPECTED_CHAIN_ID=11155111" > .env.tmp && grep -v "VITE_EXPECTED_CHAIN_ID" .env >> .env.tmp 2>/dev/null && mv .env.tmp .env || echo "VITE_EXPECTED_CHAIN_ID=11155111" >> .env

cd server
echo "CHAIN_ID=11155111" > .env.tmp && grep -v "CHAIN_ID" .env >> .env.tmp 2>/dev/null && mv .env.tmp .env || echo "CHAIN_ID=11155111" >> .env

# Add Mantle signer (replace with actual values)
echo "MANTLE_SIGNER_ADDRESS=0xYourAddress" >> .env
echo "MANTLE_PRIVATE_KEY=0xYourPrivateKey" >> .env

echo "✅ Configuration updated! Now restart your backend server."
```

## After Fixing

1. ✅ Chain IDs match (11155111)
2. ✅ Mantle signer configured
3. ✅ Backend can generate signatures
4. ✅ Frontend can connect to contracts
5. ✅ Everything communicates properly!

Run `./test-connection.sh` to verify everything works.


