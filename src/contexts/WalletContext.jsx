import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

const WalletContext = createContext();

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

// Helper function to get the ethereum provider safely
export const getEthereumProvider = () => {
  try {
    if (typeof window === 'undefined') {
      return null;
    }

    // Check if ethereum exists and is accessible
    if (!window.ethereum) {
      return null;
    }

    // Handle case where ethereum might be an array of providers
    if (Array.isArray(window.ethereum.providers)) {
      // Prefer MetaMask if available
      const metaMaskProvider = window.ethereum.providers.find(
        (p) => p.isMetaMask
      );
      return metaMaskProvider || window.ethereum.providers[0];
    }

    return window.ethereum;
  } catch (error) {
    // Handle cases where browser extensions are conflicting
    // (e.g., "Cannot redefine property: ethereum")
    // Suppress this specific error as it's from browser extensions, not our code
    if (error.message && error.message.includes('Cannot redefine property: ethereum')) {
      // Silently handle - this is from browser extensions conflicting
      return null;
    }
    console.warn('Error accessing ethereum provider:', error);
    return null;
  }
};

// Helper function to safely add event listener
export const safeAddListener = (provider, event, handler) => {
  if (!provider) return;
  
  try {
    // Check if the provider has the 'on' method
    if (typeof provider.on === 'function') {
      provider.on(event, handler);
    } else if (typeof provider.addEventListener === 'function') {
      // Some providers use addEventListener
      provider.addEventListener(event, handler);
    }
  } catch (error) {
    console.warn(`Failed to add listener for ${event}:`, error);
  }
};

// Helper function to safely remove event listener
export const safeRemoveListener = (provider, event, handler) => {
  if (!provider) return;
  
  try {
    // Check if the provider has the 'removeListener' method
    if (typeof provider.removeListener === 'function') {
      provider.removeListener(event, handler);
    } else if (typeof provider.removeEventListener === 'function') {
      // Some providers use removeEventListener
      provider.removeEventListener(event, handler);
    }
  } catch (error) {
    console.warn(`Failed to remove listener for ${event}:`, error);
  }
};

export const WalletProvider = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [networkId, setNetworkId] = useState(null);

  const EXPECTED_CHAIN_ID = Number(import.meta.env.VITE_EXPECTED_CHAIN_ID || 0) || null;

  const handleAccountsChanged = useCallback((accounts) => {
    if (accounts.length > 0) {
      setWalletAddress(accounts[0]);
    } else {
      setWalletAddress(null);
      setNetworkId(null);
    }
  }, []);

  const handleChainChanged = useCallback(async (chainId) => {
    const numericChainId = typeof chainId === 'string' 
      ? parseInt(chainId, 16) 
      : Number(chainId);
    setNetworkId(numericChainId);
  }, []);

  const handleDisconnect = useCallback(() => {
    setWalletAddress(null);
    setNetworkId(null);
  }, []);

  const checkWalletConnection = useCallback(async () => {
    const ethereumProvider = getEthereumProvider();
    if (!ethereumProvider) {
      return;
    }

    try {
      const accounts = await ethereumProvider.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
        // Also get network info
        const provider = new ethers.BrowserProvider(ethereumProvider);
        const network = await provider.getNetwork();
        setNetworkId(Number(network.chainId));
      }
    } catch (error) {
      console.error("Error checking wallet connection:", error);
    }
  }, []);

  // Check wallet connection on mount
  useEffect(() => {
    checkWalletConnection();
    
    const provider = getEthereumProvider();
    if (provider) {
      safeAddListener(provider, 'accountsChanged', handleAccountsChanged);
      safeAddListener(provider, 'chainChanged', handleChainChanged);
      safeAddListener(provider, 'disconnect', handleDisconnect);
    }

    return () => {
      if (provider) {
        safeRemoveListener(provider, 'accountsChanged', handleAccountsChanged);
        safeRemoveListener(provider, 'chainChanged', handleChainChanged);
        safeRemoveListener(provider, 'disconnect', handleDisconnect);
      }
    };
  }, [checkWalletConnection, handleAccountsChanged, handleChainChanged, handleDisconnect]);

  const connectWallet = async () => {
    const ethereumProvider = getEthereumProvider();
    
    if (!ethereumProvider) {
      throw new Error("Please install MetaMask or another Web3 wallet to connect your wallet!");
    }

    setIsConnecting(true);
    try {
      const provider = new ethers.BrowserProvider(ethereumProvider);
      const accounts = await ethereumProvider.request({
        method: 'eth_requestAccounts'
      });
      
      if (accounts.length > 0) {
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        const network = await provider.getNetwork();
        
        setWalletAddress(address);
        setNetworkId(Number(network.chainId));
        
        return address;
      }
    } catch (error) {
      console.error("Error connecting to wallet:", error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setWalletAddress(null);
    setNetworkId(null);
  };

  const isConnected = !!walletAddress;
  
  // Debug logging
  useEffect(() => {
    console.log('WalletContext state changed:', { walletAddress, isConnected, isConnecting, networkId });
  }, [walletAddress, isConnected, isConnecting, networkId]);

  const value = {
    walletAddress,
    isConnecting,
    networkId,
    connectWallet,
    disconnectWallet,
    isConnected,
    EXPECTED_CHAIN_ID
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};