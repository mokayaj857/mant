# 🔧 Error Fixes

## Issue 1: "Cannot redefine property: ethereum" ✅ FIXED
- **Status**: Error suppression improved in `main.jsx`
- **Note**: This is a browser extension conflict and is now handled gracefully
- **Action**: No action needed - error is suppressed

## Issue 2: "abi is not iterable" ✅ FIXED
- **Status**: ABI extraction function updated
- **Problem**: ABI files are JSON objects with `{ "abi": [...] }` structure
- **Fix**: Updated `getABI()` function to extract the `abi` array from JSON objects
- **Action**: Refresh your browser - the fix is in place

## Issue 3: Server 500 Error on `/api/mantle/mint-proof` ⚠️ NEEDS FIX

**Error**: `invalid BytesLike value` - Private key has extra text

**Problem**: Your `MANTLE_PRIVATE_KEY` in `server/.env` has text appended to it:
```
MANTLE_PRIVATE_KEY=0xd9029272647cc3421ba86330040fd6d9c7abc1599ef02504a2eed883a5db51a2AVARA_CORE_ADDRESS=0x5F9F8883C67d68B79a5779339a48237B9A3325EB
```

**Fix**: Edit `event-vax/server/.env` and make sure each variable is on its own line:

```bash
MANTLE_PRIVATE_KEY=0xd9029272647cc3421ba86330040fd6d9c7abc1599ef02504a2eed883a5db51a2
AVARA_CORE_ADDRESS=0x5F9F8883C67d68B79a5779339a48237B9A3325EB
TICKET_NFT_ADDRESS=0xbb2853a001A47a25f5f0392A5E7cDBFa90448945
POAP_NFT_ADDRESS=0x7d552D09B4468583CaFda67d3057E62711CF7131
```

**Quick Fix Command**:
```bash
cd event-vax/server

# Fix the private key (ensure it's on its own line)
# Edit .env manually or use:
sed -i 's/MANTLE_PRIVATE_KEY=.*AVARA_CORE_ADDRESS.*/MANTLE_PRIVATE_KEY=0xd9029272647cc3421ba86330040fd6d9c7abc1599ef02504a2eed883a5db51a2\nAVARA_CORE_ADDRESS=0x5F9F8883C67d68B79a5779339a48237B9A3325EB/' .env

# Then restart your server
```

## Summary

✅ **Fixed**: Ethereum property conflict (suppressed)
✅ **Fixed**: ABI import issue (extraction function updated)
⚠️ **Action Required**: Fix `MANTLE_PRIVATE_KEY` in `server/.env` - remove extra text

After fixing the private key and restarting the server, everything should work!

