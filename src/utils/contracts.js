import { ethers } from 'ethers';
import AvaraCoreABI from '../abi/AvaraCore.json';
import TicketNFTABI from '../abi/TicketNFT.json';
import POAPNFTABI from '../abi/POAPNFT.json';

// Contract addresses - these should be set via environment variables
// For now, using placeholder addresses that need to be updated after deployment
const AVARA_CORE_ADDRESS = import.meta.env.VITE_AVARA_CORE_ADDRESS || '';
const TICKET_NFT_ADDRESS = import.meta.env.VITE_TICKET_NFT_ADDRESS || '';
const POAP_NFT_ADDRESS = import.meta.env.VITE_POAP_NFT_ADDRESS || '';

export const resolveContractAddresses = (overrides = {}) => {
  return {
    AVARA_CORE: overrides?.AVARA_CORE ?? overrides?.avaraCore ?? AVARA_CORE_ADDRESS,
    TICKET_NFT: overrides?.TICKET_NFT ?? overrides?.ticketNFT ?? TICKET_NFT_ADDRESS,
    POAP_NFT: overrides?.POAP_NFT ?? overrides?.poapNFT ?? POAP_NFT_ADDRESS,
  };
};

const assertAddressesConfigured = (addresses) => {
  const missing = [];
  if (!addresses?.AVARA_CORE) missing.push('AVARA_CORE');
  if (!addresses?.TICKET_NFT) missing.push('TICKET_NFT');
  if (!addresses?.POAP_NFT) missing.push('POAP_NFT');
  if (missing.length > 0) {
    throw new Error(
      `Missing contract address(es): ${missing.join(', ')}. ` +
        `Set VITE_AVARA_CORE_ADDRESS / VITE_TICKET_NFT_ADDRESS / VITE_POAP_NFT_ADDRESS ` +
        `or provide them via /api/contracts/config.`
    );
  }
};

/**
 * Get contract instances
 * @param {ethers.BrowserProvider} provider - Ethers provider
 * @param {ethers.Signer} signer - Ethers signer (optional, for write operations)
 * @returns {Object} Contract instances
 */
export const getContracts = (provider, signer = null, addressOverrides = null) => {
  if (!provider) {
    throw new Error('Provider is required');
  }

  const addresses = resolveContractAddresses(addressOverrides || {});
  assertAddressesConfigured(addresses);

  const contractProvider = signer || provider;

  const avaraCore = new ethers.Contract(
    addresses.AVARA_CORE,
    AvaraCoreABI,
    contractProvider
  );

  const ticketNFT = new ethers.Contract(
    addresses.TICKET_NFT,
    TicketNFTABI,
    contractProvider
  );

  const poapNFT = new ethers.Contract(
    addresses.POAP_NFT,
    POAPNFTABI,
    contractProvider
  );

  return {
    avaraCore,
    ticketNFT,
    poapNFT,
  };
};

/**
 * Get contract instances with signer (for write operations)
 * @param {ethers.BrowserProvider} provider - Ethers provider
 * @returns {Promise<Object>} Contract instances with signer
 */
export const getContractsWithSigner = async (provider) => {
  if (!provider) {
    throw new Error('Provider is required');
  }

  const signer = await provider.getSigner();
  return getContracts(provider, signer);
};

/**
 * Mint a ticket using KRNL signature
 * @param {ethers.Contract} avaraCore - AvaraCore contract instance
 * @param {string} to - Address to mint ticket to
 * @param {string} uri - Token URI
 * @param {number} eventId - Event ID
 * @param {number} timestamp - Timestamp
 * @param {number} nonce - Nonce
 * @param {string} krnlSignature - KRNL signature (hex string)
 * @returns {Promise<ethers.ContractTransactionResponse>}
 */
export const mintTicketWithKrnl = async (
  avaraCore,
  to,
  uri,
  eventId,
  timestamp,
  nonce,
  krnlSignature
) => {
  try {
    const tx = await avaraCore.mintTicketWithKrnl(
      to,
      uri,
      eventId,
      timestamp,
      nonce,
      krnlSignature
    );
    return tx;
  } catch (error) {
    console.error('Error minting ticket:', error);
    
    // Provide user-friendly error messages
    const errorCode = error?.code;
    const errorMessage = error?.message?.toLowerCase() || '';
    const errorData = error?.data || {};
    
    // RPC endpoint errors
    if (errorCode === -32002 || 
        errorMessage.includes('rpc endpoint') ||
        errorMessage.includes('rpc endpoint not found') ||
        errorMessage.includes('rpc endpoint returned too many errors') ||
        errorData?.httpStatus === 522) {
      throw new Error('RPC endpoint is unavailable. Please check your network connection or switch to a different network. If using a local node, ensure it is running.');
    }
    
    // Network/Chain ID errors
    if (errorCode === 4902 || 
        errorMessage.includes('unrecognized chain id') ||
        errorMessage.includes('chain id')) {
      throw new Error('Unrecognized network. Please add this network to your wallet or switch to a supported network.');
    }
    
    // User rejection
    if (errorCode === 4001 || 
        errorMessage.includes('user rejected') ||
        errorMessage.includes('rejected')) {
      throw new Error('Transaction was rejected. Please approve the transaction to continue.');
    }
    
    // Insufficient funds
    if (errorMessage.includes('insufficient funds') ||
        errorMessage.includes('insufficient balance')) {
      throw new Error('Insufficient funds. Please ensure you have enough tokens to cover the transaction and gas fees.');
    }
    
    // Re-throw with original error if no specific handling
    throw error;
  }
};

/**
 * List a ticket for sale
 * @param {ethers.Contract} avaraCore - AvaraCore contract instance
 * @param {number} ticketId - Ticket ID
 * @param {string} price - Price in ETH (will be converted to wei)
 * @returns {Promise<ethers.ContractTransactionResponse>}
 */
export const listTicket = async (avaraCore, ticketId, price) => {
  try {
    const priceInWei = ethers.parseEther(price.toString());
    const tx = await avaraCore.listTicket(ticketId, priceInWei);
    return tx;
  } catch (error) {
    console.error('Error listing ticket:', error);
    throw error;
  }
};

/**
 * Buy a listed ticket
 * @param {ethers.Contract} avaraCore - AvaraCore contract instance
 * @param {number} ticketId - Ticket ID
 * @param {string} price - Price in ETH (will be converted to wei)
 * @returns {Promise<ethers.ContractTransactionResponse>}
 */
export const buyTicket = async (avaraCore, ticketId, price) => {
  try {
    const priceInWei = ethers.parseEther(price.toString());
    const tx = await avaraCore.buyTicket(ticketId, { value: priceInWei });
    return tx;
  } catch (error) {
    console.error('Error buying ticket:', error);
    throw error;
  }
};

/**
 * Check in and mint POAP
 * @param {ethers.Contract} avaraCore - AvaraCore contract instance
 * @param {number} ticketId - Ticket ID
 * @param {number} eventId - Event ID
 * @param {string} poapUri - POAP metadata URI
 * @param {number} timestamp - Timestamp
 * @param {number} nonce - Nonce
 * @param {string} krnlSignature - KRNL signature (hex string)
 * @returns {Promise<ethers.ContractTransactionResponse>}
 */
export const checkInAndMintPOAP = async (
  avaraCore,
  ticketId,
  eventId,
  poapUri,
  timestamp,
  nonce,
  krnlSignature
) => {
  try {
    const tx = await avaraCore.checkInAndMintPOAP(
      ticketId,
      eventId,
      poapUri,
      timestamp,
      nonce,
      krnlSignature
    );
    return tx;
  } catch (error) {
    console.error('Error checking in and minting POAP:', error);
    throw error;
  }
};

/**
 * Get ticket listing information
 * @param {ethers.Contract} avaraCore - AvaraCore contract instance
 * @param {number} ticketId - Ticket ID
 * @returns {Promise<Object>} Listing information
 */
export const getListing = async (avaraCore, ticketId) => {
  try {
    const listing = await avaraCore.listings(ticketId);
    return {
      seller: listing.seller,
      price: listing.price.toString(),
      active: listing.active,
    };
  } catch (error) {
    console.error('Error getting listing:', error);
    throw error;
  }
};

/**
 * Get user's ticket balance
 * @param {ethers.Contract} ticketNFT - TicketNFT contract instance
 * @param {string} address - User address
 * @returns {Promise<number>} Balance
 */
export const getTicketBalance = async (ticketNFT, address) => {
  try {
    const balance = await ticketNFT.balanceOf(address);
    return Number(balance);
  } catch (error) {
    console.error('Error getting ticket balance:', error);
    throw error;
  }
};

/**
 * Get user's POAP balance
 * @param {ethers.Contract} poapNFT - POAPNFT contract instance
 * @param {string} address - User address
 * @returns {Promise<number>} Balance
 */
export const getPOAPBalance = async (poapNFT, address) => {
  try {
    const balance = await poapNFT.balanceOf(address);
    return Number(balance);
  } catch (error) {
    console.error('Error getting POAP balance:', error);
    throw error;
  }
};

/**
 * Get ticket owner
 * @param {ethers.Contract} ticketNFT - TicketNFT contract instance
 * @param {number} ticketId - Ticket ID
 * @returns {Promise<string>} Owner address
 */
export const getTicketOwner = async (ticketNFT, ticketId) => {
  try {
    const owner = await ticketNFT.ownerOf(ticketId);
    return owner;
  } catch (error) {
    console.error('Error getting ticket owner:', error);
    throw error;
  }
};

/**
 * Get ticket URI
 * @param {ethers.Contract} ticketNFT - TicketNFT contract instance
 * @param {number} ticketId - Ticket ID
 * @returns {Promise<string>} Token URI
 */
export const getTicketURI = async (ticketNFT, ticketId) => {
  try {
    const uri = await ticketNFT.tokenURI(ticketId);
    return uri;
  } catch (error) {
    console.error('Error getting ticket URI:', error);
    throw error;
  }
};

/**
 * Get ticket event ID
 * @param {ethers.Contract} ticketNFT - TicketNFT contract instance
 * @param {number} ticketId - Ticket ID
 * @returns {Promise<number>} Event ID
 */
export const getTicketEventId = async (ticketNFT, ticketId) => {
  try {
    const eventId = await ticketNFT.ticketEvent(ticketId);
    return Number(eventId);
  } catch (error) {
    console.error('Error getting ticket event ID:', error);
    throw error;
  }
};

/**
 * Get reputation score
 * @param {ethers.Contract} avaraCore - AvaraCore contract instance
 * @param {string} address - User address
 * @returns {Promise<number>} Reputation score
 */
export const getReputation = async (avaraCore, address) => {
  try {
    const reputation = await avaraCore.reputation(address);
    return Number(reputation);
  } catch (error) {
    console.error('Error getting reputation:', error);
    throw error;
  }
};

/**
 * Get event rules
 * @param {ethers.Contract} avaraCore - AvaraCore contract instance
 * @param {number} eventId - Event ID
 * @returns {Promise<Object>} Event rules
 */
export const getEventRules = async (avaraCore, eventId) => {
  try {
    const rules = await avaraCore.rules(eventId);
    return {
      organizer: rules.organizer,
      maxResalePrice: rules.maxResalePrice.toString(),
      maxTransfers: Number(rules.maxTransfers),
    };
  } catch (error) {
    console.error('Error getting event rules:', error);
    throw error;
  }
};

/**
 * Cancel a listing
 * @param {ethers.Contract} avaraCore - AvaraCore contract instance
 * @param {number} ticketId - Ticket ID
 * @returns {Promise<ethers.ContractTransactionResponse>}
 */
export const cancelListing = async (avaraCore, ticketId) => {
  try {
    const tx = await avaraCore.cancelListing(ticketId);
    return tx;
  } catch (error) {
    console.error('Error canceling listing:', error);
    throw error;
  }
};

/**
 * Get ticket provenance
 * @param {ethers.Contract} avaraCore - AvaraCore contract instance
 * @param {number} ticketId - Ticket ID
 * @returns {Promise<string[]>} Array of addresses in provenance chain
 */
export const getTicketProvenance = async (avaraCore, ticketId) => {
  try {
    const provenance = await avaraCore.getTicketProvenance(ticketId);
    return provenance;
  } catch (error) {
    console.error('Error getting ticket provenance:', error);
    throw error;
  }
};

// Export contract addresses for reference
export const CONTRACT_ADDRESSES = {
  AVARA_CORE: AVARA_CORE_ADDRESS,
  TICKET_NFT: TICKET_NFT_ADDRESS,
  POAP_NFT: POAP_NFT_ADDRESS,
};
