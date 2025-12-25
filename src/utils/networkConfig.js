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
    rpcUrls: ['https://rpc.testnet.mantle.xyz'],
    blockExplorerUrls: ['https://explorer.testnet.mantle.xyz'],
  },
  sepolia: {
    chainId: '0xAA36A7', // 11155111 in hex
    chainIdDecimal: 11155111,
    chainName: 'Mantle Sepolia',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: ['https://rpc.sepolia.mantle.xyz'],
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
  return null;
};

/**
 * Switch to Mantle network in MetaMask
 * @param {string} network - 'mainnet', 'testnet', or 'sepolia'
 * @returns {Promise<void>}
 */
export const switchToMantleNetwork = async (network = 'testnet') => {
  const ethereum = window.ethereum;
  if (!ethereum) {
    throw new Error('MetaMask is not installed');
  }

  const networkConfig = MANTLE_NETWORKS[network];
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
        // Add the network to MetaMask
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: networkConfig.chainId,
            chainName: networkConfig.chainName,
            nativeCurrency: networkConfig.nativeCurrency,
            rpcUrls: networkConfig.rpcUrls,
            blockExplorerUrls: networkConfig.blockExplorerUrls,
          }],
        });
      } catch (addError) {
        throw new Error(`Failed to add ${networkConfig.chainName} to MetaMask: ${addError.message}`);
      }
    } else if (switchError.code === 4001) {
      throw new Error('Network switch was rejected by user');
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

