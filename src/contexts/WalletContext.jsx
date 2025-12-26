import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { getExpectedChainId, isCorrectNetwork as checkCorrectNetwork } from '../utils/networkConfig';

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
  if (typeof window === 'undefined') {
    return null;
  }

  // Multiple strategies to detect MetaMask/Web3 wallet
  let ethereum = null;

  // Strategy 1: Direct access (most common)
  try {
    if (window.ethereum) {
      ethereum = window.ethereum;
    }
  } catch (e) {
    // Ignore errors from direct access - might be blocked by extensions
  }

  // Strategy 2: Try to access via property descriptor (for conflicting extensions)
  if (!ethereum) {
    try {
      const descriptor = Object.getOwnPropertyDescriptor(window, 'ethereum');
      if (descriptor && descriptor.value) {
        ethereum = descriptor.value;
      }
    } catch (e) {
      // Ignore
    }
  }

  // Strategy 3: Try accessing via getOwnPropertyNames (fallback)
  if (!ethereum) {
    try {
      const props = Object.getOwnPropertyNames(window);
      if (props.includes('ethereum')) {
        ethereum = window.ethereum;
      }
    } catch (e) {
      // Ignore
    }
  }

  // Strategy 4: Check for web3 (legacy)
  if (!ethereum && window.web3 && window.web3.currentProvider) {
    ethereum = window.web3.currentProvider;
  }

  if (!ethereum) {
    // Debug: Log what we found
    console.log('MetaMask detection: window.ethereum =', typeof window.ethereum !== 'undefined' ? 'exists' : 'undefined');
    return null;
  }

  // Handle case where ethereum might be an array of providers
  if (Array.isArray(ethereum.providers)) {
    // Prefer MetaMask if available
    const metaMaskProvider = ethereum.providers.find(
      (p) => p && p.isMetaMask
    );
    if (metaMaskProvider) {
      return metaMaskProvider;
    }
    // Return first available provider
    return ethereum.providers[0] || ethereum;
  }

  return ethereum;
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
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);

  const EXPECTED_CHAIN_ID = getExpectedChainId();

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
    setIsCorrectNetwork(checkCorrectNetwork(numericChainId, EXPECTED_CHAIN_ID));
  }, [EXPECTED_CHAIN_ID]);

  const handleDisconnect = useCallback(() => {
    setWalletAddress(null);
    setNetworkId(null);
  }, []);

  const checkWalletConnection = useCallback(async () => {
    const ethereumProvider = getEthereumProvider();
    if (!ethereumProvider) {
      // Log for debugging but don't set error - user might not have wallet yet
      console.log('No ethereum provider found. Make sure MetaMask or another Web3 wallet is installed and unlocked.');
      return;
    }

    try {
      const accounts = await ethereumProvider.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
        // Also get network info
        const provider = new ethers.BrowserProvider(ethereumProvider);
        const network = await provider.getNetwork();
        const chainId = Number(network.chainId);
        setNetworkId(chainId);
        setIsCorrectNetwork(checkCorrectNetwork(chainId, EXPECTED_CHAIN_ID));
      }
    } catch (error) {
      console.error("Error checking wallet connection:", error);
      // Don't throw - just log the error
    }
  }, [EXPECTED_CHAIN_ID]);

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
      // Provide more helpful error message
      const errorMsg = typeof window !== 'undefined' && window.ethereum 
        ? "Unable to access wallet. Please make sure MetaMask is unlocked and try refreshing the page."
        : "Please install MetaMask or another Web3 wallet to connect your wallet!";
      throw new Error(errorMsg);
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
        const chainId = Number(network.chainId);
        
        setWalletAddress(address);
        setNetworkId(chainId);
        setIsCorrectNetwork(checkCorrectNetwork(chainId, EXPECTED_CHAIN_ID));
        
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
    isCorrectNetwork,
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