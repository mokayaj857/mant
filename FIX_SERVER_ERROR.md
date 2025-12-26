# 🔧 Fix Server Error: Invalid Private Key

## Problem

The server is returning a 500 error when trying to create mint proofs. The error shows:

```
invalid BytesLike value (argument="value", value="0xd9029272647cc3421ba86330040fd6d9c7abc1599ef02504a2eed883a5db51a2AVARA_CORE_ADDRESS=0x5F9F8883C67d68B79a5779339a48237B9A3325EB"
```

**This means your `MANTLE_PRIVATE_KEY` in `server/.env` has extra text appended to it!**

## Fix

Your `server/.env` file likely has the private key on the same line as another variable, or there's a missing newline. 

**Check your `server/.env` file:**

```bash
cd event-vax/server
cat .env | grep MANTLE_PRIVATE_KEY
```

**It should look like this:**
```bash
MANTLE_PRIVATE_KEY=0xd9029272647cc3421ba86330040fd6d9c7abc1599ef02504a2eed883a5db51a2
```

**NOT like this (wrong - no extra text):**
```bash
MANTLE_PRIVATE_KEY=0xd9029272647cc3421ba86330040fd6d9c7abc1599ef02504a2eed883a5db51a2AVARA_CORE_ADDRESS=0x5F9F8883C67d68B79a5779339a48237B9A3325EB
```

## Quick Fix

```bash
cd event-vax/server

# Fix the private key (replace with your actual private key)
sed -i 's/MANTLE_PRIVATE_KEY=.*/MANTLE_PRIVATE_KEY=0xd9029272647cc3421ba86330040fd6d9c7abc1599ef02504a2eed883a5db51a2/' .env

# Make sure each variable is on its own line
# Check the file:
cat .env
```

## After Fixing

1. **Restart your backend server**
2. **Test the endpoint:**
   ```bash
   curl -X POST http://localhost:8080/api/mantle/mint-proof \
     -H "Content-Type: application/json" \
     -d '{"to":"0x1234567890123456789012345678901234567890","eventId":1}'
   ```
3. **Should return success with a signature**

