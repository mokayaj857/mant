# Switch to Sepolia Testnet

To use Sepolia testnet for minting, update your environment variables:

## Frontend Configuration

Edit `event-vax/.env`:
```bash
VITE_EXPECTED_CHAIN_ID=11155111
```

## Backend Configuration

Edit `event-vax/server/.env`:
```bash
CHAIN_ID=11155111
```

## After Updating

1. **Restart your frontend dev server** (if running):
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

2. **Restart your backend server** (if running):
   ```bash
   cd server
   # Stop current server (Ctrl+C)
   npm start
   ```

3. **Refresh your browser** to load the new configuration

4. **Switch MetaMask to Sepolia Testnet**:
   - The app will prompt you to switch
   - Or manually switch in MetaMask to Sepolia Testnet (Chain ID: 11155111)

## Verify Configuration

After switching, the app should:
- Prompt you to switch to Sepolia if you're on a different network
- Show Sepolia Testnet in error messages
- Use Sepolia for all contract interactions

## Contract Addresses

Make sure your contract addresses in `server/.env` are for contracts deployed on Sepolia:
```bash
AVARA_CORE_ADDRESS=0x...  # Sepolia address
TICKET_NFT_ADDRESS=0x...  # Sepolia address
POAP_NFT_ADDRESS=0x...    # Sepolia address
```

