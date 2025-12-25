import React, { useEffect, useState } from 'react';
import Chatbit from './Chatbit';
import { useWallet } from '../contexts/WalletContext';

const CreateEvent = () => {
  const { walletAddress, connectWallet, isConnected } = useWallet();
  const [eventData, setEventData] = useState({
    name: '',
    date: '',
    venue: '',
    ticketPrice: '',
    totalTickets: '',
  });

  useEffect(() => {
    // Wallet connection is managed by WalletContext.
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEventData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isConnected || !walletAddress) {
      try {
        await connectWallet();
      } catch (error) {
        console.error('Error connecting wallet:', error);
        alert('Please connect your wallet first.');
        return;
      }
    }

    try {
      const payload = {
        eventName: eventData.name,
        eventDate: eventData.date,
        venue: eventData.venue,
        regularPrice: eventData.ticketPrice,
        description: '',
        flyerImage: null,
        creatorAddress: walletAddress,
        totalTickets: eventData.totalTickets,
      };

      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || 'Failed to create the event');
      }

      alert('Event created successfully!');
    } catch (error) {
      console.error('Error creating event:', error);
      alert(error?.message || 'Failed to create the event. See console for details.');
    }
  };


  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-3xl font-semibold text-gray-800 text-center mb-6">Create Event</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2" htmlFor="name">Event Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={eventData.name}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-md"
            placeholder="Enter event name"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2" htmlFor="date">Event Date</label>
          <input
            type="date"
            id="date"
            name="date"
            value={eventData.date}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-md"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2" htmlFor="description">Event Venue</label>
          <textarea
            id="venue"
            name="venue"
            value={eventData.venue}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-md"
            placeholder="Enter event venue"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2" htmlFor="ticketPrice">Ticket Price (ETH)</label>
          <input
            type='number'
            name='ticketPrice'
            value={eventData.ticketPrice}
            onChange={handleChange}
            required
            step={"0.001"}
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2" htmlFor="totalTickets">Total Tickets</label>
          <input 
            type='number'
            name='totalTickets'
            value={eventData.totalTickets}
            onChange={handleChange}
            required
          />
        </div>

        <div className="text-center">
          <button
            type="submit"
            className="bg-purple-500 text-white py-2 px-6 rounded-md hover:bg-purple-600 transition duration-300"
          >
            Create Event
      <section>
        <div>
          <Chatbit />
        </div>
      </section>
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateEvent;