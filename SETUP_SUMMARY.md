# KRNL Smart Contracts Integration - Setup Summary

## ✅ What Has Been Completed

### 1. ABI Files
- ✅ Copied ABI files from compiled contracts to `src/abi/`:
  - `AvaraCore.json` - Main contract ABI
  - `TicketNFT.json` - Ticket NFT contract ABI
  - `POAPNFT.json` - POAP NFT contract ABI

### 2. Contract Utilities (`src/utils/contracts.js`)
- ✅ Created utility functions for all contract interactions:
  - Contract instance creation
  - Ticket minting with KRNL signatures
  - Marketplace operations (list, buy, cancel)
  - Check-in and POAP minting
  - Read operations (balance, owner, URI, etc.)

### 3. React Hook (`src/hooks/useAvaraContracts.js`)
- ✅ Created `useAvaraContracts` hook that provides:
  - Contract instances (read-only and with signer)
  - All write operations (mint, list, buy, check-in, etc.)
  - All read operations (balance, info, reputation, etc.)
  - Loading and error states

### 4. Example Component (`src/components/AvaraContractExample.jsx`)
- ✅ Created a complete example component demonstrating:
  - User stats (tickets, POAPs, reputation)
  - Ticket lookup
  - Listing tickets for sale
  - Buying tickets
  - Canceling listings
  - Contract address display

### 5. Documentation
- ✅ Created `KRNL_INTEGRATION_GUIDE.md` with:
  - Setup instructions
  - Usage examples
  - API reference
  - Troubleshooting guide

### 6. Environment Configuration
- ✅ Created `.env.example` template for contract addresses

### 7. Route Integration
- ✅ Added example route at `/contracts` in `main.jsx`

## 🚀 Next Steps

### 1. Deploy Contracts
If you haven't deployed the contracts yet:
```bash
cd event-vax/krnl/avara
# Follow DEPLOYMENT_GUIDE.md
```

### 2. Configure Environment Variables
Create a `.env` file in `event-vax/` directory:
```env
VITE_AVARA_CORE_ADDRESS=0xYourDeployedAddress
VITE_TICKET_NFT_ADDRESS=0xYourDeployedAddress
VITE_POAP_NFT_ADDRESS=0xYourDeployedAddress
```

### 3. Test the Integration
1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `/contracts` route to see the example component

3. Connect your wallet and test the contract interactions

### 4. Integrate into Your Components
Use the `useAvaraContracts` hook in your existing components:

```jsx
import { useAvaraContracts } from '../hooks/useAvaraContracts';

function MyComponent() {
  const { getUserTicketBalance, purchaseTicket } = useAvaraContracts();
  // Use the functions...
}
```

## 📁 File Structure

```
event-vax/
├── src/
│   ├── abi/
│   │   ├── AvaraCore.json          # Main contract ABI
│   │   ├── TicketNFT.json          # Ticket NFT ABI
│   │   └── POAPNFT.json            # POAP NFT ABI
│   ├── components/
│   │   └── AvaraContractExample.jsx # Example component
│   ├── hooks/
│   │   └── useAvaraContracts.js    # React hook for contracts
│   ├── utils/
│   │   └── contracts.js            # Contract utility functions
│   └── main.jsx                    # Updated with /contracts route
├── .env.example                    # Environment template
├── KRNL_INTEGRATION_GUIDE.md       # Complete integration guide
└── SETUP_SUMMARY.md                # This file
```

## 🔧 Available Functions

### Write Operations (require wallet)
- `mintTicket()` - Mint ticket with KRNL signature
- `listTicketForSale()` - List ticket on marketplace
- `purchaseTicket()` - Buy a listed ticket
- `checkIn()` - Check in and mint POAP
- `cancelTicketListing()` - Cancel active listing

### Read Operations (no wallet needed)
- `getTicketInfo()` - Get ticket details
- `getUserTicketBalance()` - Get user's ticket count
- `getUserPOAPBalance()` - Get user's POAP count
- `getTicketListing()` - Get listing information
- `getUserReputation()` - Get reputation score
- `getEventRulesInfo()` - Get event rules
- `getProvenance()` - Get ticket provenance chain

## 📚 Documentation

- **Full Guide**: See `KRNL_INTEGRATION_GUIDE.md`
- **Contract Code**: See `krnl/avara/contracts/avara.sol`
- **Deployment**: See `krnl/avara/DEPLOYMENT_GUIDE.md`

## ⚠️ Important Notes

1. **Contract Addresses**: You must update the `.env` file with actual deployed contract addresses
2. **Network**: Make sure you're on the correct network (configured in WalletContext)
3. **KRNL Signatures**: For minting and check-in, you'll need KRNL signatures from your backend or KRNL node
4. **Gas Fees**: All write operations require ETH for gas fees

## 🐛 Troubleshooting

If you encounter issues:
1. Check that contract addresses in `.env` are correct
2. Verify MetaMask is connected and on the correct network
3. Ensure you have enough ETH for gas fees
4. Check browser console for detailed error messages
5. Review `KRNL_INTEGRATION_GUIDE.md` for common issues

## ✨ Example Usage

See `src/components/AvaraContractExample.jsx` for a complete working example, or visit `/contracts` route in your app.

