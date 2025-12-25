# Frontend-Smart Contract Integration Guide

This guide will help you connect your frontend with the deployed smart contracts on Mantle network.

## Prerequisites

1. Smart contracts deployed on Mantle network
2. Contract addresses from deployment
3. Server running with contract configuration endpoint
4. MetaMask or compatible Web3 wallet installed

## Step 1: Configure Environment Variables

Create a `.env` file in the `event-vax` directory:

```bash
# API Configuration
VITE_API_URL=http://localhost:8080

# Expected Chain ID (Mantle Testnet: 5001, Mantle Mainnet: 5000)
VITE_EXPECTED_CHAIN_ID=5001

# Contract Addresses (optional - will be fetched from server if not set)
VITE_AVARA_CORE_ADDRESS=0xYourAvaraCoreAddress
VITE_TICKET_NFT_ADDRESS=0xYourTicketNFTAddress
VITE_POAP_NFT_ADDRESS=0xYourPOAPNFTAddress
```

## Step 2: Configure Server Environment Variables

Update your server `.env` file with the deployed contract addresses:

```bash
# Chain Configuration
CHAIN_ID=5001  # Mantle Testnet

# Contract Addresses
AVARA_CORE_ADDRESS=0xYourAvaraCoreAddress
TICKET_NFT_ADDRESS=0xYourTicketNFTAddress
POAP_NFT_ADDRESS=0xYourPOAPNFTAddress

# Mantle Signer Configuration
MANTLE_SIGNER_ADDRESS=0xYourMantleSignerAddress
MANTLE_PRIVATE_KEY=0xYourMantlePrivateKey
```

## Step 3: Update ABIs (if needed)

If you've made changes to the contracts, update the ABIs:

```bash
cd event-vax/mantle/avara

# After compiling contracts, copy ABIs to frontend
cp artifacts/avara.sol/AvaraCore.json ../src/abi/AvaraCore.json
cp artifacts/ticket.sol/TicketNFT.json ../src/abi/TicketNFT.json
cp artifacts/poap.sol/POAPNFT.json ../src/abi/POAPNFT.json
```

## Step 4: Network Configuration

The frontend now includes automatic Mantle network detection and switching. Users will be prompted to switch to Mantle network when connecting their wallet.

### Supported Networks:
- **Mantle Testnet** (Chain ID: 5001) - Default for development
- **Mantle Mainnet** (Chain ID: 5000) - Production
- **Mantle Sepolia** (Chain ID: 11155111) - Alternative testnet

## Step 5: Using Contracts in Components

### Basic Usage

```javascript
import { useWallet } from '../contexts/WalletContext';
import { useAvaraContracts } from '../hooks/useAvaraContracts';
import { switchToMantleNetwork } from '../utils/networkConfig';

function MyComponent() {
  const { walletAddress, connectWallet, networkId } = useWallet();
  const { 
    contracts, 
    contractsWithSigner, 
    mintTicket, 
    isReady,
    loading,
    error 
  } = useAvaraContracts();

  // Switch to Mantle network
  const handleConnect = async () => {
    try {
      await switchToMantleNetwork('testnet'); // or 'mainnet'
      await connectWallet();
    } catch (error) {
      console.error('Failed to connect:', error);
    }
  };

  // Mint a ticket
  const handleMint = async () => {
    try {
      // First, get Mantle signature from server
      const response = await fetch('/api/mantle/mint-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: walletAddress,
          eventId: 1
        })
      });
      
      const { data } = await response.json();
      
      // Then mint with the signature
      const tx = await mintTicket(
        walletAddress,
        'ipfs://token-uri',
        data.eventId,
        data.timestamp,
        data.nonce,
        data.signature
      );
      
      await tx.wait();
      console.log('Ticket minted!', tx.hash);
    } catch (error) {
      console.error('Minting failed:', error);
    }
  };

  return (
    <div>
      {!walletAddress && (
        <button onClick={handleConnect}>Connect Wallet</button>
      )}
      
      {isReady && walletAddress && (
        <button onClick={handleMint} disabled={loading}>
          {loading ? 'Minting...' : 'Mint Ticket'}
        </button>
      )}
      
      {error && <p>Error: {error}</p>}
    </div>
  );
}
```

## Step 6: Testing the Connection

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Connect your wallet:**
   - Click "Connect Wallet" button
   - Approve MetaMask connection
   - Approve network switch to Mantle (if prompted)

3. **Verify contract connection:**
   - Check browser console for contract initialization messages
   - Try reading contract data (e.g., ticket balance)
   - Test a write operation (e.g., mint ticket)

## Troubleshooting

### Issue: "Missing contract address(es)"
**Solution:** 
- Ensure contract addresses are set in `.env` file OR
- Ensure server is running and `/api/contracts/config` returns addresses

### Issue: "Unrecognized chain ID"
**Solution:**
- The frontend will automatically prompt to add Mantle network
- Or manually add Mantle network in MetaMask:
  - Network Name: Mantle Testnet
  - RPC URL: https://rpc.testnet.mantle.xyz
  - Chain ID: 5001
  - Currency Symbol: MNT

### Issue: "Transaction failed"
**Solutions:**
- Ensure you have MNT tokens for gas fees
- Check that you're on the correct network
- Verify contract addresses are correct
- Check server logs for Mantle signature generation errors

### Issue: "RPC endpoint unavailable"
**Solutions:**
- Check your internet connection
- Verify RPC URL is correct
- Try switching to a different Mantle RPC endpoint
- Check if Mantle network is experiencing issues

## API Endpoints

The frontend expects these server endpoints:

- `GET /api/contracts/config` - Returns contract addresses and chain ID
- `POST /api/mantle/mint-proof` - Generates Mantle signature for minting
- `POST /api/mantle/checkin-proof` - Generates Mantle signature for check-in

## Next Steps

1. Deploy contracts to Mantle network
2. Update environment variables with deployed addresses
3. Test contract interactions
4. Deploy frontend to production

## Support

For issues or questions:
- Check contract deployment logs
- Review server logs for API errors
- Check browser console for frontend errors
- Verify network connectivity

