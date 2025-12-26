/**
 * Network configuration utilities for Mantle and other networks
 */

// Mantle Network Configurations
export const MANTLE_NETWORKS = {
  mainnet: {
    chainId: '0x1388', // 5000 in hex
    chainIdDecimal: 5000,
    chainName: 'Mantle Mainnet',
    nativeCurrency: {
      name: 'Mantle',
      symbol: 'MNT',
      decimals: 18,
    },
    rpcUrls: ['https://rpc.mantle.xyz'],
    blockExplorerUrls: ['https://explorer.mantle.xyz'],
  },
  testnet: {
    chainId: '0x1389', // 5001 in hex
    chainIdDecimal: 5001,
    chainName: 'Mantle Testnet',
    nativeCurrency: {
      name: 'Mantle',
      symbol: 'MNT',
      decimals: 18,
    },
    rpcUrls: [
      'https://rpc.testnet.mantle.xyz',
      'https://mantle-testnet.rpc.thirdweb.com',
      'https://rpc.ankr.com/mantle_testnet',
    ],
    blockExplorerUrls: ['https://explorer.testnet.mantle.xyz'],
  },
  sepolia: {
    chainId: '0xAA36A7', // 11155111 in hex
    chainIdDecimal: 11155111,
    chainName: 'Sepolia',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: [
      'https://rpc.sepolia.org',
      'https://sepolia.infura.io/v3/',
      'https://ethereum-sepolia-rpc.publicnode.com',
      'https://rpc.sepolia.mantle.xyz',
    ],
    blockExplorerUrls: ['https://sepolia.etherscan.io'],
  },
  custom5003: {
    chainId: '0x138b', // 5003 in hex
    chainIdDecimal: 5003,
    chainName: 'Mantle Custom Network',
    nativeCurrency: {
      name: 'Mantle',
      symbol: 'MNT',
      decimals: 18,
    },
    rpcUrls: ['https://rpc.sepolia.mantle.xyz'], // Using Sepolia RPC as fallback
    blockExplorerUrls: ['https://explorer.sepolia.mantle.xyz'],
  },
};

/**
 * Get the expected chain ID from environment or default to Mantle Testnet
 */
export const getExpectedChainId = () => {
  const envChainId = import.meta.env.VITE_EXPECTED_CHAIN_ID;
  if (envChainId) {
    return Number(envChainId);
  }
  // Default to Mantle Testnet
  return MANTLE_NETWORKS.testnet.chainIdDecimal;
};

/**
 * Get network configuration by chain ID
 */
export const getNetworkConfig = (chainId) => {
  const chainIdNum = typeof chainId === 'string' 
    ? (chainId.startsWith('0x') ? parseInt(chainId, 16) : parseInt(chainId))
    : Number(chainId);

  for (const network of Object.values(MANTLE_NETWORKS)) {
    if (network.chainIdDecimal === chainIdNum) {
      return network;
    }
  }
  
  // If not found, return a default config for the chain ID
  return {
    chainId: `0x${chainIdNum.toString(16)}`,
    chainIdDecimal: chainIdNum,
    chainName: `Custom Network ${chainIdNum}`,
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: ['https://rpc.sepolia.mantle.xyz'],
    blockExplorerUrls: ['https://explorer.sepolia.mantle.xyz'],
  };
};

/**
 * Switch to Mantle network in MetaMask
 * @param {string|number} network - 'mainnet', 'testnet', 'sepolia', or chain ID number
 * @returns {Promise<void>}
 */
export const switchToMantleNetwork = async (network = 'testnet') => {
  const ethereum = window.ethereum;
  if (!ethereum) {
    throw new Error('MetaMask is not installed');
  }

  let networkConfig;
  
  // If network is a number, get config by chain ID
  if (typeof network === 'number') {
    networkConfig = getNetworkConfig(network);
  } else {
    networkConfig = MANTLE_NETWORKS[network];
  }
  
  if (!networkConfig) {
    throw new Error(`Unknown network: ${network}`);
  }

  try {
    // Try to switch to the network
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: networkConfig.chainId }],
    });
  } catch (switchError) {
    // This error code indicates that the chain has not been added to MetaMask
    if (switchError.code === 4902 || switchError.message?.includes('Unrecognized chain ID')) {
      try {
        // Ensure RPC URLs are properly formatted (use array format)
        const rpcUrls = Array.isArray(networkConfig.rpcUrls) 
          ? networkConfig.rpcUrls 
          : [networkConfig.rpcUrls || 'https://rpc.sepolia.org'];
        const blockExplorerUrls = Array.isArray(networkConfig.blockExplorerUrls)
          ? networkConfig.blockExplorerUrls
          : [networkConfig.blockExplorerUrls || 'https://sepolia.etherscan.io'];
        
        // Add the network to MetaMask
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: networkConfig.chainId,
            chainName: networkConfig.chainName,
            nativeCurrency: networkConfig.nativeCurrency,
            rpcUrls: rpcUrls,
            blockExplorerUrls: blockExplorerUrls,
          }],
        });
        // After adding, try switching again
        await ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: networkConfig.chainId }],
        });
      } catch (addError) {
        throw new Error(`Failed to add ${networkConfig.chainName} to MetaMask: ${addError.message}. Please add it manually in MetaMask settings.`);
      }
    } else if (switchError.code === 4001) {
      throw new Error('Network switch was rejected by user. Please switch manually in MetaMask.');
    } else {
      throw switchError;
    }
  }
};

/**
 * Check if connected to the expected network
 * @param {number} currentChainId - Current chain ID
 * @param {number} expectedChainId - Expected chain ID (optional)
 * @returns {boolean}
 */
export const isCorrectNetwork = (currentChainId, expectedChainId = null) => {
  const expected = expectedChainId || getExpectedChainId();
  return Number(currentChainId) === expected;
};

