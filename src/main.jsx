import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { WalletProvider } from './contexts/WalletContext';

// Suppress "Cannot redefine property: ethereum" errors from browser extensions
if (typeof window !== 'undefined') {
  // Intercept Object.defineProperty to prevent the error from being thrown
  const originalDefineProperty = Object.defineProperty;
  Object.defineProperty = function(obj, prop, descriptor) {
    // If trying to define 'ethereum' on window and it already exists, allow it silently
    if (obj === window && prop === 'ethereum' && window.ethereum) {
      try {
        return originalDefineProperty.call(this, obj, prop, descriptor);
      } catch (e) {
        // Silently ignore - browser extensions are conflicting
        return obj;
      }
    }
    return originalDefineProperty.call(this, obj, prop, descriptor);
  };

  // Suppress console errors - check all arguments for the error message
  const originalError = console.error;
  console.error = (...args) => {
    // Check all arguments for the error message
    const hasEthereumError = args.some(arg => {
      const str = String(arg || '');
      return str.includes('Cannot redefine property: ethereum') || 
             str.includes('evmAsk.js') ||
             (arg && typeof arg === 'object' && arg.message && arg.message.includes('Cannot redefine property: ethereum'));
    });
    
    if (hasEthereumError) {
      // Silently ignore this error - it's from browser extensions conflicting
      return;
    }
    originalError.apply(console, args);
  };

  // Suppress uncaught errors from browser extensions
  window.addEventListener('error', (event) => {
    if (event.message && (
        event.message.includes('Cannot redefine property: ethereum') ||
        event.filename?.includes('evmAsk.js')
      )) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      return true;
    }
  }, true);

  // Also catch unhandled promise rejections that might contain this error
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    if (reason && (
        String(reason).includes('Cannot redefine property: ethereum') ||
        (reason.message && reason.message.includes('Cannot redefine property: ethereum'))
      )) {
      event.preventDefault();
      return;
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