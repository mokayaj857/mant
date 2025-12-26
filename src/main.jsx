import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { WalletProvider } from './contexts/WalletContext';

// Suppress "Cannot redefine property: ethereum" errors from browser extensions
if (typeof window !== 'undefined') {
  // Store original methods before any extensions load
  const originalDefineProperty = Object.defineProperty;
  const originalError = console.error;
  
  // Intercept Object.defineProperty EARLY to prevent the error
  Object.defineProperty = function(obj, prop, descriptor) {
    // If trying to define 'ethereum' on window and it already exists
    if (obj === window && prop === 'ethereum') {
      // If ethereum already exists, return it without redefining
      if (window.ethereum) {
        try {
          // Try to merge properties if descriptor is provided
          if (descriptor && typeof descriptor === 'object') {
            // Just return existing ethereum - don't try to redefine
            return window.ethereum;
          }
        } catch (e) {
          // Ignore - return existing
        }
        return window.ethereum;
      }
      // If it doesn't exist, define it normally
      try {
        return originalDefineProperty.call(this, obj, prop, descriptor);
      } catch (e) {
        // If definition fails but ethereum exists, return it
        if (window.ethereum) {
          return window.ethereum;
        }
        // Otherwise return the object unchanged
        return obj;
      }
    }
    // For all other cases, use original behavior
    try {
      return originalDefineProperty.call(this, obj, prop, descriptor);
    } catch (e) {
      // If it's about ethereum and it exists, return it
      if (obj === window && prop === 'ethereum' && window.ethereum) {
        return window.ethereum;
      }
      throw e;
    }
  };

  // Suppress console errors for ethereum property conflicts
  console.error = (...args) => {
    const errorStr = args.map(a => String(a || '')).join(' ');
    if (errorStr.includes('Cannot redefine property: ethereum') || 
        errorStr.includes('evmAsk.js') ||
        errorStr.includes('Object.defineProperty')) {
      // Silently ignore - browser extensions are conflicting
      return;
    }
    originalError.apply(console, args);
  };

  // Suppress uncaught errors from browser extensions
  const errorHandler = (event) => {
    const message = event.message || event.error?.message || '';
    const filename = event.filename || event.error?.fileName || '';
    if (message.includes('Cannot redefine property: ethereum') ||
        filename.includes('evmAsk.js') ||
        filename.includes('inject.js')) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      return false;
    }
  };
  
  window.addEventListener('error', errorHandler, true);
  
  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const reasonStr = String(reason || '');
    if (reasonStr.includes('Cannot redefine property: ethereum') ||
        (reason?.message && reason.message.includes('Cannot redefine property: ethereum'))) {
      event.preventDefault();
      return false;
    }
  });
}
import Home from './pages/Home';
import Discover from './pages/Discover';
import Testimonials from './pages/Testimonials';
import Hero from './pages/Hero';
import EventList from './pages/EventList';
import EventDetails from './pages/EventDetails';
import Qrcode from './pages/Qrcode';
import Chatbit from './pages/Chatbit';
import Footer from './components/Footer';
import Ticketsell from './pages/Ticketsell';
import MintNFT from './pages/MintNFT';
import Ticket from './pages/Ticket';
import Teams from './pages/Teams';
import Layout from './Layout';
import Myevent from './pages/Myevent';
import Profile from './pages/Profile';
import EventDashboard from './pages/EventDashboard';
import './index.css';
import WaitlistPage from './pages/WaitingList';
import QuantumTicketResale from './pages/QuantamTicketResale';
import AvaraContractExample from './components/AvaraContractExample';
import { debugWallet } from './utils/walletDebug';

// Make debug utility available
if (typeof window !== 'undefined') {
  window.debugWallet = debugWallet;
}

// App component that wraps RouterProvider with providers
const App = () => {
  return (
    <ChakraProvider value={defaultSystem}>
      <WalletProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout><Home /></Layout>} />
            <Route path="testimonials" element={<Layout><Testimonials /></Layout>} />
            <Route path="qrcode" element={<Layout><Qrcode /></Layout>} />
            <Route path="ticket" element={<Layout><Ticket /></Layout>} />
            <Route path="teams" element={<Layout><Teams /></Layout>} />
            <Route path="hero" element={<Layout><Hero /></Layout>} />
            <Route path="event" element={<Layout><EventList /></Layout>} />
            <Route path="mint" element={<Layout><MintNFT /></Layout>} />
            <Route path="event-details" element={<Layout><EventDetails /></Layout>} />
            <Route path="Myevent" element={<Layout><Myevent /></Layout>} />
            <Route path="chatbit" element={<Layout><Chatbit /></Layout>} />
            <Route path="waiting" element={<Layout><WaitlistPage /></Layout>} />
            <Route path="resell" element={<Layout><QuantumTicketResale /></Layout>} />
            <Route path="profile" element={<Layout><Profile /></Layout>} />
            <Route path="event-dashboard/:eventId" element={<Layout><EventDashboard /></Layout>} />
            <Route path="contracts" element={<Layout><AvaraContractExample /></Layout>} />
            <Route path="*" element={<Layout><Footer /></Layout>} />
          </Routes>
        </BrowserRouter>
      </WalletProvider>
    </ChakraProvider>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);