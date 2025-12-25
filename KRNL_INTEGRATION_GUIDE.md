# KRNL Smart Contracts Frontend Integration Guide

This guide explains how to connect the KRNL Avara smart contracts with the frontend React application.

## Overview

The integration provides a complete interface to interact with the Avara smart contracts:
- **AvaraCore**: Main contract for ticket minting, marketplace, and POAP issuance
- **TicketNFT**: ERC721 contract for event tickets
- **POAPNFT**: ERC721 contract for Proof of Attendance Protocol badges

## Setup

### 1. Environment Variables

Create a `.env` file in the `event-vax` directory with the following variables:

```env
# Avara Smart Contract Addresses
# After deploying the contracts, update these addresses
VITE_AVARA_CORE_ADDRESS=0xYourAvaraCoreAddress
VITE_TICKET_NFT_ADDRESS=0xYourTicketNFTAddress
VITE_POAP_NFT_ADDRESS=0xYourPOAPNFTAddress
```

**Note**: After deploying the contracts, you'll need to:
1. Get the AvaraCore contract address
2. Get the TicketNFT and POAPNFT addresses (these are deployed automatically by AvaraCore)
3. Update the `.env` file with these addresses

### 2. Contract Deployment

If you haven't deployed the contracts yet, follow the deployment guide:

```bash
cd event-vax/krnl/avara
# Follow instructions in DEPLOYMENT_GUIDE.md
```

After deployment, you'll receive:
- AvaraCore contract address
- TicketNFT contract address (deployed by AvaraCore)
- POAPNFT contract address (deployed by AvaraCore)

## Usage

### Basic Usage with the Hook

The `useAvaraContracts` hook provides all the functionality you need:

```jsx
import { useAvaraContracts } from '../hooks/useAvaraContracts';
import { useWallet } from '../contexts/WalletContext';

function MyComponent() {
  const { walletAddress, isConnected } = useWallet();
  const {
    contracts,
    contractsWithSigner,
    loading,
    error,
    getUserTicketBalance,
    purchaseTicket,
    listTicketForSale,
  } = useAvaraContracts();

  // Get user's ticket balance
  useEffect(() => {
    const loadBalance = async () => {
      if (walletAddress) {
        const balance = await getUserTicketBalance(walletAddress);
        console.log('Ticket balance:', balance);
      }
    };
    loadBalance();
  }, [walletAddress, getUserTicketBalance]);

  // List a ticket for sale
  const handleListTicket = async () => {
    try {
      const tx = await listTicketForSale(1, '0.1'); // ticketId, price in ETH
      await tx.wait();
      console.log('Ticket listed!', tx.hash);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  return (
    <div>
      {/* Your component UI */}
    </div>
  );
}
```

### Available Functions

#### Write Functions (require wallet connection)

- **`mintTicket(to, uri, eventId, timestamp, nonce, krnlSignature)`**: Mint a ticket with KRNL signature
- **`listTicketForSale(ticketId, price)`**: List a ticket for sale on the marketplace
- **`purchaseTicket(ticketId, price)`**: Purchase a listed ticket
- **`checkIn(ticketId, eventId, poapUri, timestamp, nonce, krnlSignature)`**: Check in and mint POAP
- **`cancelTicketListing(ticketId)`**: Cancel an active listing

#### Read Functions (no wallet required)

- **`getTicketInfo(ticketId)`**: Get ticket owner, URI, and event ID
- **`getUserTicketBalance(address)`**: Get user's ticket balance
- **`getUserPOAPBalance(address)`**: Get user's POAP balance
- **`getTicketListing(ticketId)`**: Get listing information for a ticket
- **`getUserReputation(address)`**: Get user's reputation score
- **`getEventRulesInfo(eventId)`**: Get event rules (max price, max transfers)
- **`getProvenance(ticketId)`**: Get ticket provenance chain

### Example: Complete Ticket Purchase Flow

```jsx
import { useAvaraContracts } from '../hooks/useAvaraContracts';
import { useWallet } from '../contexts/WalletContext';

function TicketPurchase() {
  const { isConnected, connectWallet } = useWallet();
  const { purchaseTicket, getTicketListing, loading } = useAvaraContracts();
  const [ticketId, setTicketId] = useState('');
  const [listing, setListing] = useState(null);

  // Load listing when ticketId changes
  useEffect(() => {
    const loadListing = async () => {
      if (ticketId) {
        try {
          const listingInfo = await getTicketListing(Number(ticketId));
          setListing(listingInfo);
        } catch (err) {
          console.error('Error loading listing:', err);
        }
      }
    };
    loadListing();
  }, [ticketId, getTicketListing]);

  const handlePurchase = async () => {
    if (!listing || !listing.active) {
      alert('Ticket is not for sale');
      return;
    }

    try {
      const priceInEth = ethers.formatEther(listing.price);
      const tx = await purchaseTicket(Number(ticketId), priceInEth);
      await tx.wait();
      alert('Purchase successful!');
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div>
      <input
        type="number"
        value={ticketId}
        onChange={(e) => setTicketId(e.target.value)}
        placeholder="Ticket ID"
      />
      {listing && (
        <div>
          <p>Price: {ethers.formatEther(listing.price)} ETH</p>
          <button onClick={handlePurchase} disabled={loading}>
            Buy Ticket
          </button>
        </div>
      )}
    </div>
  );
}
```

### Example: Mint Ticket with KRNL Signature

```jsx
import { useAvaraContracts } from '../hooks/useAvaraContracts';

function MintTicket() {
  const { mintTicket, loading } = useAvaraContracts();
  const { walletAddress } = useWallet();

  const handleMint = async () => {
    // In a real app, you would get the KRNL signature from your backend
    // or from the KRNL node API
    const krnlSignature = '0x...'; // Get from KRNL
    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = Date.now();

    try {
      const tx = await mintTicket(
        walletAddress,           // to
        'ipfs://...',            // uri
        1,                       // eventId
        timestamp,               // timestamp
        nonce,                   // nonce
        krnlSignature            // krnlSignature
      );
      await tx.wait();
      alert('Ticket minted!');
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <button onClick={handleMint} disabled={loading}>
      Mint Ticket
    </button>
  );
}
```

## Contract Addresses

After deployment, the contract addresses will be available in:
- `contracts.avaraCore.target`
- `contracts.ticketNFT.target`
- `contracts.poapNFT.target`

Or you can import them from the utilities:

```jsx
import { CONTRACT_ADDRESSES } from '../utils/contracts';
console.log(CONTRACT_ADDRESSES.AVARA_CORE);
```

## Error Handling

All functions throw errors that should be caught:

```jsx
try {
  const tx = await purchaseTicket(ticketId, price);
  await tx.wait();
} catch (error) {
  if (error.code === 'ACTION_REJECTED') {
    alert('Transaction was rejected');
  } else if (error.code === 'INSUFFICIENT_FUNDS') {
    alert('Insufficient funds');
  } else {
    alert(`Error: ${error.message}`);
  }
}
```

## Testing

See `src/components/AvaraContractExample.jsx` for a complete example component that demonstrates all the contract interactions.

To use it, add it to your routes:

```jsx
import AvaraContractExample from './components/AvaraContractExample';

// In your router
<Route path="/contracts" element={<AvaraContractExample />} />
```

## Troubleshooting

### Contracts not initialized

- Make sure `.env` file has the correct contract addresses
- Ensure MetaMask is installed and connected
- Check that you're on the correct network

### Transaction fails

- Check that you have enough ETH for gas
- Verify the contract addresses are correct
- Ensure you have the required permissions (e.g., ticket owner for listing)

### ABI errors

- Make sure the ABI files are in `src/abi/`:
  - `AvaraCore.json`
  - `TicketNFT.json`
  - `POAPNFT.json`

## Next Steps

1. Deploy the contracts to your target network
2. Update the `.env` file with contract addresses
3. Test the integration using `AvaraContractExample` component
4. Integrate the hooks into your existing components

## Support

For issues or questions:
- Check the contract deployment guide: `krnl/avara/DEPLOYMENT_GUIDE.md`
- Review the smart contract code: `krnl/avara/contracts/avara.sol`

