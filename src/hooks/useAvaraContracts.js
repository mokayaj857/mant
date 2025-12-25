import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWallet, getEthereumProvider, safeAddListener, safeRemoveListener } from '../contexts/WalletContext';
import {
  getContracts,
  getContractsWithSigner,
  mintTicketWithKrnl,
  listTicket,
  buyTicket,
  checkInAndMintPOAP,
  getListing,
  getTicketBalance,
  getPOAPBalance,
  getTicketOwner,
  getTicketURI,
  getTicketEventId,
  getReputation,
  getEventRules,
  cancelListing,
  getTicketProvenance,
} from '../utils/contracts';

/**
 * Custom hook for interacting with Avara smart contracts
 * @returns {Object} Contract instances and helper functions
 */
export const useAvaraContracts = () => {
  const { walletAddress, isConnected } = useWallet();
  const [contracts, setContracts] = useState(null);
  const [contractsWithSigner, setContractsWithSigner] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [provider, setProvider] = useState(null);

  // Initialize provider and contracts
  useEffect(() => {
    const initContracts = async () => {
      const ethereumProvider = getEthereumProvider();
      if (!ethereumProvider) {
        setError('MetaMask or another Web3 wallet is not installed');
        return;
      }

      try {
        const browserProvider = new ethers.BrowserProvider(ethereumProvider);
        setProvider(browserProvider);

        // Get read-only contracts
        const readOnlyContracts = getContracts(browserProvider);
        setContracts(readOnlyContracts);

        // Get contracts with signer if wallet is connected
        if (isConnected && walletAddress) {
          const contractsWithSignerInstance = await getContractsWithSigner(browserProvider);
          setContractsWithSigner(contractsWithSignerInstance);
        } else {
          setContractsWithSigner(null);
        }
      } catch (err) {
        console.error('Error initializing contracts:', err);
        setError(err.message);
      }
    };

    initContracts();

    // Listen for account changes
    const ethereumProvider = getEthereumProvider();
    if (ethereumProvider) {
      const handleAccountsChanged = async () => {
        await initContracts();
      };

      safeAddListener(ethereumProvider, 'accountsChanged', handleAccountsChanged);

      return () => {
        safeRemoveListener(ethereumProvider, 'accountsChanged', handleAccountsChanged);
      };
    }
  }, [isConnected, walletAddress]);

  // Mint ticket with KRNL signature
  const mintTicket = useCallback(
    async (to, uri, eventId, timestamp, nonce, krnlSignature) => {
      if (!contractsWithSigner?.avaraCore) {
        throw new Error('Contracts not initialized or wallet not connected');
      }

      setLoading(true);
      setError(null);
      try {
        const tx = await mintTicketWithKrnl(
          contractsWithSigner.avaraCore,
          to,
          uri,
          eventId,
          timestamp,
          nonce,
          krnlSignature
        );
        await tx.wait();
        return tx;
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [contractsWithSigner]
  );

  // List ticket for sale
  const listTicketForSale = useCallback(
    async (ticketId, price) => {
      if (!contractsWithSigner?.avaraCore) {
        throw new Error('Contracts not initialized or wallet not connected');
      }

      setLoading(true);
      setError(null);
      try {
        const tx = await listTicket(contractsWithSigner.avaraCore, ticketId, price);
        await tx.wait();
        return tx;
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [contractsWithSigner]
  );

  // Buy ticket
  const purchaseTicket = useCallback(
    async (ticketId, price) => {
      if (!contractsWithSigner?.avaraCore) {
        throw new Error('Contracts not initialized or wallet not connected');
      }

      setLoading(true);
      setError(null);
      try {
        const tx = await buyTicket(contractsWithSigner.avaraCore, ticketId, price);
        await tx.wait();
        return tx;
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [contractsWithSigner]
  );

  // Check in and mint POAP
  const checkIn = useCallback(
    async (ticketId, eventId, poapUri, timestamp, nonce, krnlSignature) => {
      if (!contractsWithSigner?.avaraCore) {
        throw new Error('Contracts not initialized or wallet not connected');
      }

      setLoading(true);
      setError(null);
      try {
        const tx = await checkInAndMintPOAP(
          contractsWithSigner.avaraCore,
          ticketId,
          eventId,
          poapUri,
          timestamp,
          nonce,
          krnlSignature
        );
        await tx.wait();
        return tx;
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [contractsWithSigner]
  );

  // Cancel listing
  const cancelTicketListing = useCallback(
    async (ticketId) => {
      if (!contractsWithSigner?.avaraCore) {
        throw new Error('Contracts not initialized or wallet not connected');
      }

      setLoading(true);
      setError(null);
      try {
        const tx = await cancelListing(contractsWithSigner.avaraCore, ticketId);
        await tx.wait();
        return tx;
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [contractsWithSigner]
  );

  // Read-only functions
  const getTicketInfo = useCallback(
    async (ticketId) => {
      if (!contracts?.ticketNFT) {
        throw new Error('Contracts not initialized');
      }

      try {
        const [owner, uri, eventId] = await Promise.all([
          getTicketOwner(contracts.ticketNFT, ticketId),
          getTicketURI(contracts.ticketNFT, ticketId),
          getTicketEventId(contracts.ticketNFT, ticketId),
        ]);

        return { owner, uri, eventId };
      } catch (err) {
        console.error('Error getting ticket info:', err);
        throw err;
      }
    },
    [contracts]
  );

  const getUserTicketBalance = useCallback(
    async (address) => {
      if (!contracts?.ticketNFT || !address) {
        return 0;
      }

      try {
        return await getTicketBalance(contracts.ticketNFT, address);
      } catch (err) {
        console.error('Error getting ticket balance:', err);
        return 0;
      }
    },
    [contracts]
  );

  const getUserPOAPBalance = useCallback(
    async (address) => {
      if (!contracts?.poapNFT || !address) {
        return 0;
      }

      try {
        return await getPOAPBalance(contracts.poapNFT, address);
      } catch (err) {
        console.error('Error getting POAP balance:', err);
        return 0;
      }
    },
    [contracts]
  );

  const getTicketListing = useCallback(
    async (ticketId) => {
      if (!contracts?.avaraCore) {
        throw new Error('Contracts not initialized');
      }

      try {
        return await getListing(contracts.avaraCore, ticketId);
      } catch (err) {
        console.error('Error getting listing:', err);
        throw err;
      }
    },
    [contracts]
  );

  const getUserReputation = useCallback(
    async (address) => {
      if (!contracts?.avaraCore || !address) {
        return 0;
      }

      try {
        return await getReputation(contracts.avaraCore, address);
      } catch (err) {
        console.error('Error getting reputation:', err);
        return 0;
      }
    },
    [contracts]
  );

  const getEventRulesInfo = useCallback(
    async (eventId) => {
      if (!contracts?.avaraCore) {
        throw new Error('Contracts not initialized');
      }

      try {
        return await getEventRules(contracts.avaraCore, eventId);
      } catch (err) {
        console.error('Error getting event rules:', err);
        throw err;
      }
    },
    [contracts]
  );

  const getProvenance = useCallback(
    async (ticketId) => {
      if (!contracts?.avaraCore) {
        throw new Error('Contracts not initialized');
      }

      try {
        return await getTicketProvenance(contracts.avaraCore, ticketId);
      } catch (err) {
        console.error('Error getting provenance:', err);
        throw err;
      }
    },
    [contracts]
  );

  return {
    // Contract instances
    contracts,
    contractsWithSigner,
    provider,

    // State
    loading,
    error,
    isReady: !!contracts,

    // Write functions (require signer)
    mintTicket,
    listTicketForSale,
    purchaseTicket,
    checkIn,
    cancelTicketListing,

    // Read functions
    getTicketInfo,
    getUserTicketBalance,
    getUserPOAPBalance,
    getTicketListing,
    getUserReputation,
    getEventRulesInfo,
    getProvenance,
  };
};

