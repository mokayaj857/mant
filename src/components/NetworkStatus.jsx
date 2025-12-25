import React from 'react';
import { useWallet } from '../contexts/WalletContext';
import { switchToMantleNetwork, getExpectedChainId, isCorrectNetwork } from '../utils/networkConfig';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';

/**
 * Component to display network status and help users switch to the correct network
 */
export const NetworkStatus = () => {
  const { networkId, isConnected } = useWallet();
  const [isSwitching, setIsSwitching] = React.useState(false);
  const [error, setError] = React.useState(null);

  const expectedChainId = getExpectedChainId();
  const isOnCorrectNetwork = networkId ? isCorrectNetwork(networkId, expectedChainId) : false;

  const handleSwitchNetwork = async () => {
    setIsSwitching(true);
    setError(null);
    
    try {
      // Determine which network to switch to based on expected chain ID
      let network = 'testnet';
      if (expectedChainId === 5000) network = 'mainnet';
      else if (expectedChainId === 11155111) network = 'sepolia';
      
      await switchToMantleNetwork(network);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSwitching(false);
    }
  };

  if (!isConnected) {
    return null;
  }

  if (isOnCorrectNetwork) {
    return (
      <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-2 rounded-lg">
        <CheckCircle className="w-4 h-4" />
        <span className="text-sm">Connected to Mantle Network</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 px-4 py-3 rounded-lg">
      <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-medium text-yellow-800">
          Wrong Network Detected
        </p>
        <p className="text-xs text-yellow-700 mt-1">
          Please switch to Mantle Network (Chain ID: {expectedChainId}) to continue.
        </p>
        {error && (
          <p className="text-xs text-red-600 mt-1">{error}</p>
        )}
      </div>
      <button
        onClick={handleSwitchNetwork}
        disabled={isSwitching}
        className="px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {isSwitching ? (
          <>
            <Loader className="w-4 h-4 animate-spin" />
            Switching...
          </>
        ) : (
          'Switch Network'
        )}
      </button>
    </div>
  );
};

