/**
 * Debug utility to check MetaMask/wallet availability
 * Run this in browser console to diagnose wallet connection issues
 */
export const debugWallet = () => {
  const results = {
    windowExists: typeof window !== 'undefined',
    ethereumExists: typeof window !== 'undefined' && typeof window.ethereum !== 'undefined',
    ethereumValue: null,
    providers: null,
    metaMaskFound: false,
    errors: []
  };

  if (typeof window === 'undefined') {
    console.log('❌ Window object not available');
    return results;
  }

  // Try to access window.ethereum
  try {
    results.ethereumValue = window.ethereum;
    if (window.ethereum) {
      console.log('✅ window.ethereum exists');
      
      // Check if it's an array of providers
      if (Array.isArray(window.ethereum.providers)) {
        results.providers = window.ethereum.providers.map(p => ({
          isMetaMask: p.isMetaMask,
          isCoinbaseWallet: p.isCoinbaseWallet,
          isWalletConnect: p.isWalletConnect
        }));
        results.metaMaskFound = window.ethereum.providers.some(p => p.isMetaMask);
        console.log('✅ Multiple providers found:', results.providers);
      } else {
        results.metaMaskFound = window.ethereum.isMetaMask || false;
        console.log('✅ Single provider, isMetaMask:', results.metaMaskFound);
      }
    } else {
      console.log('⚠️ window.ethereum is falsy');
    }
  } catch (error) {
    results.errors.push(error.message);
    console.error('❌ Error accessing window.ethereum:', error);
  }

  // Try property descriptor
  try {
    const descriptor = Object.getOwnPropertyDescriptor(window, 'ethereum');
    if (descriptor) {
      console.log('✅ Property descriptor found for ethereum');
    }
  } catch (error) {
    results.errors.push(`Descriptor error: ${error.message}`);
    console.error('❌ Error getting property descriptor:', error);
  }

  return results;
};

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  window.debugWallet = debugWallet;
}

