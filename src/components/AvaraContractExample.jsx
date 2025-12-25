import React, { useState, useEffect } from 'react';
import { useAvaraContracts } from '../hooks/useAvaraContracts';
import { useWallet } from '../contexts/WalletContext';
import { ethers } from 'ethers';

/**
 * Example component demonstrating how to use the Avara smart contracts
 * This component shows various contract interactions
 */
const AvaraContractExample = () => {
  const { walletAddress, isConnected, connectWallet } = useWallet();
  const {
    contracts,
    contractsWithSigner,
    loading,
    error,
    isReady,
    getUserTicketBalance,
    getUserPOAPBalance,
    getUserReputation,
    getTicketInfo,
    getTicketListing,
    purchaseTicket,
    listTicketForSale,
    cancelTicketListing,
  } = useAvaraContracts();

  const [ticketBalance, setTicketBalance] = useState(0);
  const [poapBalance, setPoapBalance] = useState(0);
  const [reputation, setReputation] = useState(0);
  const [ticketId, setTicketId] = useState('');
  const [ticketInfo, setTicketInfo] = useState(null);
  const [listingInfo, setListingInfo] = useState(null);
  const [listPrice, setListPrice] = useState('');
  const [buyPrice, setBuyPrice] = useState('');

  // Load user balances and reputation
  useEffect(() => {
    const loadUserData = async () => {
      if (!isReady || !walletAddress) return;

      try {
        const [tickets, poaps, rep] = await Promise.all([
          getUserTicketBalance(walletAddress),
          getUserPOAPBalance(walletAddress),
          getUserReputation(walletAddress),
        ]);

        setTicketBalance(tickets);
        setPoapBalance(poaps);
        setReputation(rep);
      } catch (err) {
        console.error('Error loading user data:', err);
      }
    };

    loadUserData();
  }, [isReady, walletAddress, getUserTicketBalance, getUserPOAPBalance, getUserReputation]);

  // Load ticket info when ticketId changes
  useEffect(() => {
    const loadTicketInfo = async () => {
      if (!isReady || !ticketId) {
        setTicketInfo(null);
        setListingInfo(null);
        return;
      }

      try {
        const [info, listing] = await Promise.all([
          getTicketInfo(Number(ticketId)),
          getTicketListing(Number(ticketId)).catch(() => null),
        ]);

        setTicketInfo(info);
        setListingInfo(listing);
      } catch (err) {
        console.error('Error loading ticket info:', err);
        setTicketInfo(null);
        setListingInfo(null);
      }
    };

    loadTicketInfo();
  }, [isReady, ticketId, getTicketInfo, getTicketListing]);

  const handleListTicket = async () => {
    if (!ticketId || !listPrice) {
      alert('Please enter ticket ID and price');
      return;
    }

    try {
      const tx = await listTicketForSale(Number(ticketId), listPrice);
      alert(`Ticket listed! Transaction: ${tx.hash}`);
      setListPrice('');
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleBuyTicket = async () => {
    if (!ticketId || !buyPrice) {
      alert('Please enter ticket ID and price');
      return;
    }

    try {
      const tx = await purchaseTicket(Number(ticketId), buyPrice);
      alert(`Ticket purchased! Transaction: ${tx.hash}`);
      setBuyPrice('');
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleCancelListing = async () => {
    if (!ticketId) {
      alert('Please enter ticket ID');
      return;
    }

    try {
      const tx = await cancelTicketListing(Number(ticketId));
      alert(`Listing canceled! Transaction: ${tx.hash}`);
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  if (!isConnected) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h2 className="text-xl font-bold mb-2">Connect Wallet</h2>
          <p className="mb-4">Please connect your wallet to interact with Avara contracts.</p>
          <button
            onClick={connectWallet}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p>Loading contracts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold mb-6">Avara Smart Contract Integration</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* User Stats */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Your Stats</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-gray-600">Tickets</p>
            <p className="text-2xl font-bold">{ticketBalance}</p>
          </div>
          <div>
            <p className="text-gray-600">POAPs</p>
            <p className="text-2xl font-bold">{poapBalance}</p>
          </div>
          <div>
            <p className="text-gray-600">Reputation</p>
            <p className="text-2xl font-bold">{reputation}</p>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-4">Wallet: {walletAddress}</p>
      </div>

      {/* Ticket Lookup */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Ticket Lookup</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Ticket ID</label>
          <input
            type="number"
            value={ticketId}
            onChange={(e) => setTicketId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            placeholder="Enter ticket ID"
          />
        </div>

        {ticketInfo && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h3 className="font-bold mb-2">Ticket Information</h3>
            <p><strong>Owner:</strong> {ticketInfo.owner}</p>
            <p><strong>Event ID:</strong> {ticketInfo.eventId}</p>
            <p><strong>URI:</strong> {ticketInfo.uri}</p>
          </div>
        )}

        {listingInfo && (
          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <h3 className="font-bold mb-2">Listing Information</h3>
            <p><strong>Seller:</strong> {listingInfo.seller}</p>
            <p><strong>Price:</strong> {ethers.formatEther(listingInfo.price)} ETH</p>
            <p><strong>Active:</strong> {listingInfo.active ? 'Yes' : 'No'}</p>
          </div>
        )}
      </div>

      {/* List Ticket */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">List Ticket for Sale</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Ticket ID</label>
            <input
              type="number"
              value={ticketId}
              onChange={(e) => setTicketId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="Enter ticket ID"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Price (ETH)</label>
            <input
              type="number"
              value={listPrice}
              onChange={(e) => setListPrice(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="0.1"
            />
          </div>
          <button
            onClick={handleListTicket}
            disabled={loading}
            className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 disabled:bg-gray-400"
          >
            {loading ? 'Processing...' : 'List Ticket'}
          </button>
        </div>
      </div>

      {/* Buy Ticket */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Buy Ticket</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Ticket ID</label>
            <input
              type="number"
              value={ticketId}
              onChange={(e) => setTicketId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="Enter ticket ID"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Price (ETH)</label>
            <input
              type="number"
              value={buyPrice}
              onChange={(e) => setBuyPrice(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="0.1"
            />
          </div>
          <button
            onClick={handleBuyTicket}
            disabled={loading}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
          >
            {loading ? 'Processing...' : 'Buy Ticket'}
          </button>
        </div>
      </div>

      {/* Cancel Listing */}
      {listingInfo && listingInfo.active && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Cancel Listing</h2>
          <button
            onClick={handleCancelListing}
            disabled={loading}
            className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 disabled:bg-gray-400"
          >
            {loading ? 'Processing...' : 'Cancel Listing'}
          </button>
        </div>
      )}

      {/* Contract Addresses */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Contract Addresses</h2>
        <div className="space-y-2 text-sm">
          <p>
            <strong>AvaraCore:</strong>{' '}
            {contracts?.avaraCore?.target || 'Not configured'}
          </p>
          <p>
            <strong>TicketNFT:</strong>{' '}
            {contracts?.ticketNFT?.target || 'Not configured'}
          </p>
          <p>
            <strong>POAPNFT:</strong>{' '}
            {contracts?.poapNFT?.target || 'Not configured'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AvaraContractExample;

