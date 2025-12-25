require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');
const mongoose = require('mongoose');
const IntaSend = require('intasend-node');
const africastalking = require('africastalking');
const { ethers } = require('ethers');
const connectDB = require('./backend/db');

const app = express();

// Behind ngrok or any reverse proxy we need to trust the forwarded headers
// so express-rate-limit can extract the correct IP safely.
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => ipKeyGenerator(req, res),
});
app.use(limiter);

const ticketSchema = new mongoose.Schema({
  phoneNumber: String,
  eventId: String,
  eventName: String,
  price: Number,
  ticketCode: String,
  status: { type: String, default: 'active' },
  createdAt: { type: Date, default: Date.now },
});
const Ticket = mongoose.models.Ticket || mongoose.model('Ticket', ticketSchema);

// Fetch events from server API
const SERVER_API_URL = process.env.SERVER_API_URL || 'http://localhost:8080';

// Smart contract configuration - aligned with server env vars
const RPC_URL = process.env.RPC_URL || process.env.CHAIN_RPC_URL || 'https://api.avax.network/ext/bc/C/rpc';
const AVARA_CORE_ADDRESS = process.env.AVARA_CORE_ADDRESS || '';
const TICKET_NFT_ADDRESS = process.env.TICKET_NFT_ADDRESS || '';
const POAP_NFT_ADDRESS = process.env.POAP_NFT_ADDRESS || '';
const MANTLE_PRIVATE_KEY = process.env.MANTLE_PRIVATE_KEY || ''; // Matches server env var
const MANTLE_SIGNER_ADDRESS = process.env.MANTLE_SIGNER_ADDRESS || '';
const CHAIN_ID = process.env.CHAIN_ID || '43114'; // Avalanche Mainnet default

// Initialize provider and signer for smart contracts
let provider = null;
let signer = null;
let avaraCoreContract = null;
let ticketNFTContract = null;

// Load contract addresses from server config if not in env
async function loadContractConfig() {
  try {
    let fetchFn = globalThis.fetch;
    if (!fetchFn) {
      const https = require('https');
      const http = require('http');
      const url = require('url');
      fetchFn = (urlStr) => {
        return new Promise((resolve, reject) => {
          const parsed = url.parse(urlStr);
          const client = parsed.protocol === 'https:' ? https : http;
          const req = client.request(parsed, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
              resolve({
                ok: res.statusCode >= 200 && res.statusCode < 300,
                json: () => Promise.resolve(JSON.parse(data))
              });
            });
          });
          req.on('error', reject);
          req.end();
        });
      };
    }
    
    const response = await fetchFn(`${SERVER_API_URL}/api/contracts/config`);
    const result = await response.json();
    
    if (result.success && result.data) {
      return {
        avaraCore: result.data.avaraCore || AVARA_CORE_ADDRESS,
        ticketNFT: result.data.ticketNFT || TICKET_NFT_ADDRESS,
        poapNFT: result.data.poapNFT || POAP_NFT_ADDRESS,
        mantleSigner: result.data.mantleSigner || MANTLE_SIGNER_ADDRESS,
      };
    }
  } catch (error) {
    console.warn('⚠️ Failed to load contract config from server:', error.message);
  }
  
  return {
    avaraCore: AVARA_CORE_ADDRESS,
    ticketNFT: TICKET_NFT_ADDRESS,
    poapNFT: POAP_NFT_ADDRESS,
    mantleSigner: MANTLE_SIGNER_ADDRESS,
  };
}

// Initialize contracts
(async () => {
  if (RPC_URL && MANTLE_PRIVATE_KEY) {
    try {
      provider = new ethers.JsonRpcProvider(RPC_URL);
      signer = new ethers.Wallet(MANTLE_PRIVATE_KEY, provider);
      
      // Load contract addresses (from env or server)
      const config = await loadContractConfig();
      
      if (config.avaraCore) {
        // Load AvaraCore ABI (minimal ABI for mintTicketWithMantle)
        const AvaraCoreABI = [
          "function mintTicketWithMantle(address to, string memory uri, uint256 eventId, uint256 timestamp, uint256 nonce, bytes memory signature) external"
        ];
        
        avaraCoreContract = new ethers.Contract(config.avaraCore, AvaraCoreABI, signer);
        console.log(`✅ Smart contract provider initialized - AvaraCore: ${config.avaraCore}`);
      } else {
        console.warn('⚠️ AVARA_CORE_ADDRESS not configured, NFT minting disabled');
      }
    } catch (error) {
      console.warn('⚠️ Failed to initialize smart contract provider:', error.message);
    }
  } else {
    console.warn('⚠️ RPC_URL or MANTLE_PRIVATE_KEY not configured, NFT minting disabled');
  }
})();

async function fetchEventsFromServer() {
  try {
    // Use global fetch (Node.js 18+) or fallback to https module
    let fetchFn = globalThis.fetch;
    if (!fetchFn) {
      // Fallback for older Node.js versions
      const https = require('https');
      const http = require('http');
      const url = require('url');
      
      fetchFn = (urlStr) => {
        return new Promise((resolve, reject) => {
          const parsed = url.parse(urlStr);
          const client = parsed.protocol === 'https:' ? https : http;
          const req = client.request(parsed, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
              resolve({
                ok: res.statusCode >= 200 && res.statusCode < 300,
                json: () => Promise.resolve(JSON.parse(data))
              });
            });
          });
          req.on('error', reject);
          req.end();
        });
      };
    }
    
    const response = await fetchFn(`${SERVER_API_URL}/api/events`);
    const result = await response.json();
    
    if (result.success && result.data) {
      return result.data.map((event, index) => ({
        id: event.id.toString(),
        name: event.event_name,
        price: parseFloat(event.regular_price || event.vip_price || event.vvip_price || 0),
        venue: event.venue,
        date: event.event_date,
        description: event.description,
        index: index + 1
      }));
    }
    return [];
  } catch (error) {
    console.error('Error fetching events from server:', error);
    return [];
  }
}

// Cache events and refresh periodically
let cachedEvents = [];
let eventMap = {};

async function refreshEvents() {
  cachedEvents = await fetchEventsFromServer();
  // Create event map by index
  eventMap = {};
  cachedEvents.forEach((event, idx) => {
    eventMap[(idx + 1).toString()] = event;
  });
  console.log(`✅ Loaded ${cachedEvents.length} events from server`);
}

// Initialize events on startup
refreshEvents();
// Refresh every 5 minutes
setInterval(refreshEvents, 5 * 60 * 1000);

const intaSend = new IntaSend(
  process.env.INTASEND_PUBLIC_KEY,
  process.env.INTASEND_PRIVATE_KEY,
  process.env.INTASEND_ENV !== 'live' // true = sandbox
);

// Optional SMS client for session summaries; logs and skips if credentials are missing.
const smsClient = (() => {
  if (!process.env.AFRICASTALKING_API_KEY || !process.env.AFRICASTALKING_USERNAME) {
    console.warn('⚠️ Africa\'s Talking SMS disabled: missing AFRICASTALKING_API_KEY or AFRICASTALKING_USERNAME');
    return null;
  }
  return africastalking({
    apiKey: process.env.AFRICASTALKING_API_KEY,
    username: process.env.AFRICASTALKING_USERNAME,
  }).SMS;
})();

function extractFinalMessage(responseText) {
  if (!responseText || !responseText.startsWith('END')) return null;
  return responseText.replace(/^END\s*/, '').trim();
}

async function sendSessionSms(phoneNumber, message) {
  if (!smsClient) return;
  if (!phoneNumber) {
    console.warn('⚠️ Skipping session SMS: missing phone number');
    return;
  }

  try {
    await smsClient.send({ to: phoneNumber, message });
    console.log('📩 Sent session SMS to', phoneNumber);
  } catch (err) {
    console.error('❌ Failed to send session SMS:', err.message);
  }
}

async function initiateStkPush(phoneNumber, amount, metadata = {}) {
  // IntaSend M-Pesa STK push
  const collection = intaSend.collection();
  const payload = {
    amount,
    phone_number: phoneNumber,
    narrative: metadata.transactionDesc || 'Event Ticket',
    api_ref: metadata.accountRef || `ticket-${Date.now()}`,
    currency: 'KES',
  };

  const res = await collection.mpesaStkPush(payload);
  
  // Decode buffer response if needed
  let parsedRes = res;
  if (Buffer.isBuffer(res)) {
    try {
      parsedRes = JSON.parse(res.toString());
    } catch (e) {
      parsedRes = res.toString();
    }
  }
  
  console.log('IntaSend STK response:', parsedRes);
  
  // Check for validation errors
  if (parsedRes.type === 'validation_error' || parsedRes.error) {
    throw new Error(`IntaSend validation error: ${JSON.stringify(parsedRes.errors || parsedRes.error)}`);
  }
  
  return parsedRes;
}

app.post('/ussd', async (req, res) => {
  try {
    const { phoneNumber, text = '' } = req.body;
    const steps = text ? text.split('*') : [];

    let response = '';

    if (!phoneNumber) {
      response = 'END Missing phone number';
    } else if (text === '') {
      response = `CON Welcome to AVARA
1. Buy Ticket
2. My Tickets
3. Wallet
4. Events Near Me
5. Support
0. Exit`;
    } else if (steps[0] === '1') {
      if (steps.length === 1) {
        // Refresh events before showing list
        await refreshEvents();
        
        if (cachedEvents.length === 0) {
          response = 'END No events available. Please try again later.';
        } else {
          const eventList = cachedEvents.slice(0, 10).map((e, idx) => 
            `${idx + 1}. ${e.name} (${e.price} KES)`
          ).join('\n');
          response = `CON Select Event:\n${eventList}\n0. Back`;
        }
      } else if (steps.length === 2) {
        if (steps[1] === '0') {
          response = `CON Welcome to AVARA
1. Buy Ticket
2. My Tickets
3. Wallet
4. Events Near Me
5. Support
0. Exit`;
        } else {
          await refreshEvents();
          const event = eventMap[steps[1]];
          response = event
            ? `CON ${event.name}
Price: ${event.price} KES
Venue: ${event.venue || 'TBA'}
1. Pay with M-Pesa
0. Cancel`
            : 'END Invalid option.';
        }
      } else if (steps.length === 3 && steps[2] === '0') {
        await refreshEvents();
        if (cachedEvents.length === 0) {
          response = 'END No events available. Please try again later.';
        } else {
          const eventList = cachedEvents.slice(0, 10).map((e, idx) => 
            `${idx + 1}. ${e.name} (${e.price} KES)`
          ).join('\n');
          response = `CON Select Event:\n${eventList}\n0. Back`;
        }
      } else if (steps.length === 3 && steps[2] === '1') {
        await refreshEvents();
        const event = eventMap[steps[1]];
        if (!event) {
          response = 'END Invalid option.';
        } else {
          try {
            await initiateStkPush(phoneNumber, event.price, {
              accountRef: event.name,
              transactionDesc: 'Event Ticket',
            });

            const ticketCode = Math.floor(10000 + Math.random() * 90000).toString();

            await Ticket.create({
              phoneNumber,
              eventId: event.id,
              eventName: event.name,
              price: event.price,
              ticketCode,
            });

            // Mint NFT ticket on smart contract (if configured)
            let nftTokenId = null;
            if (avaraCoreContract && signer) {
              try {
                // Get Mantle signature from server API (matches server route /api/mantle/mint-proof)
                const https = require('https');
                const http = require('http');
                const url = require('url');
                
                const makeRequest = (urlStr, options = {}) => {
                  return new Promise((resolve, reject) => {
                    const parsed = url.parse(urlStr);
                    const client = parsed.protocol === 'https:' ? https : http;
                    const postData = JSON.stringify(options.body || {});
                    const req = client.request({
                      ...parsed,
                      method: options.method || 'GET',
                      headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(postData),
                        ...options.headers
                      }
                    }, (res) => {
                      let data = '';
                      res.on('data', chunk => data += chunk);
                      res.on('end', () => {
                        resolve({
                          ok: res.statusCode >= 200 && res.statusCode < 300,
                          json: () => Promise.resolve(JSON.parse(data))
                        });
                      });
                    });
                    req.on('error', reject);
                    if (options.body) req.write(postData);
                    req.end();
                  });
                };
                
                // Use the correct endpoint and format from server/routes/mantle.js
                const mantleRes = await makeRequest(`${SERVER_API_URL}/api/mantle/mint-proof`, {
                  method: 'POST',
                  body: {
                    to: signer.address, // Address to mint ticket to
                    eventId: parseInt(event.id) // Must be number
                  }
                });
                
                if (mantleRes.ok) {
                  const mantleResult = await mantleRes.json();
                  if (mantleResult.success && mantleResult.data) {
                    const { timestamp, nonce, signature } = mantleResult.data;
                    
                    // Mint ticket with Mantle signature
                    const tx = await avaraCoreContract.mintTicketWithMantle(
                      signer.address,
                      `ipfs://ticket-${ticketCode}`, // Token URI
                      parseInt(event.id),
                      timestamp,
                      nonce,
                      signature
                    );
                    await tx.wait();
                    nftTokenId = tx.hash;
                    console.log(`✅ Minted NFT ticket: ${nftTokenId}`);
                  }
                }
              } catch (mintError) {
                console.error('⚠️ Failed to mint NFT ticket:', mintError.message);
                // Continue even if minting fails
              }
            }

            response = `END Payment initiated.
Your Ticket Code: ${ticketCode}
Event: ${event.name}${nftTokenId ? '\nNFT: Minted' : ''}`;
          } catch (err) {
            let errorMsg = err?.message || err?.toString?.() || 'Unknown error';
            if (Buffer.isBuffer(err)) {
              try {
                errorMsg = JSON.parse(err.toString());
              } catch {
                errorMsg = err.toString();
              }
            }
            console.error('Failed to process payment:', errorMsg);
            response = 'END Payment failed. Try again.';
          }
        }
      }
    } else if (steps[0] === '2') {
      const tickets = await Ticket.find({ phoneNumber }).lean();

      if (tickets.length === 0) {
        response = 'END You have no tickets.';
      } else {
        const list = tickets.map((t) => `${t.eventName} - ${t.ticketCode}`).join('\n');
        response = `END Your Tickets:\n${list}`;
      }
    } else if (steps[0] === '3') {
      if (steps.length === 1) {
        response = `CON Wallet
1. Balance
2. Deposit
3. Withdraw
0. Back`;
      } else if (steps[1] === '0') {
        response = `CON Welcome to AVARA
1. Buy Ticket
2. My Tickets
3. Wallet
4. Events Near Me
5. Support
0. Exit`;
      } else if (steps[1] === '1') {
        response = 'END Your balance is 0 KES';
      } else if (steps[1] === '2') {
        response = `END Send money to Paybill 412345
Acc: Your Phone Number`;
      } else if (steps[1] === '3') {
        response = 'END Withdrawal sent to M-Pesa';
      }
    } else if (steps[0] === '4') {
      if (steps.length === 1) {
        await refreshEvents();
        // Group events by venue/location if available
        const venues = [...new Set(cachedEvents.map(e => e.venue).filter(Boolean))];
        
        if (venues.length === 0) {
          response = 'END No events with location data available.';
        } else {
          const venueList = venues.slice(0, 10).map((v, idx) => 
            `${idx + 1}. ${v}`
          ).join('\n');
          response = `CON Select Location:\n${venueList}\n0. Back`;
        }
      } else if (steps.length === 2) {
        if (steps[1] === '0') {
          response = `CON Welcome to AVARA
1. Buy Ticket
2. My Tickets
3. Wallet
4. Events Near Me
5. Support
0. Exit`;
        } else {
          await refreshEvents();
          const venues = [...new Set(cachedEvents.map(e => e.venue).filter(Boolean))];
          const selectedVenue = venues[parseInt(steps[1]) - 1];

          if (!selectedVenue) {
            response = 'END Invalid location.';
          } else {
            const evts = cachedEvents
              .filter(e => e.venue === selectedVenue)
              .map((e) => `${e.name} - ${e.price} KES`)
              .join('\n');
            response = evts 
              ? `END Events at ${selectedVenue}:\n${evts}`
              : `END No events found at ${selectedVenue}.`;
          }
        }
      }
    } else if (steps[0] === '5') {
      if (steps.length === 1) {
        response = `CON Support
1. Request Call-Back
2. Report Issue
0. Back`;
      } else if (steps[1] === '0') {
        response = `CON Welcome to AVARA
1. Buy Ticket
2. My Tickets
3. Wallet
4. Events Near Me
5. Support
0. Exit`;
      } else if (steps[1] === '1') {
        response = 'END We will call you shortly.';
      } else if (steps[1] === '2') {
        response = 'END Issue reported. Thank you.';
      }
    } else if (steps[0] === '0') {
      response = 'END Thank you for using AVARA';
    } else {
      response = 'END Invalid option';
    }

    res.set('Content-Type', 'text/plain');
    const finalMessage = extractFinalMessage(response);
    if (finalMessage) {
      // Send SMS and await to ensure it completes
      await sendSessionSms(phoneNumber, finalMessage);
    }
    res.send(response);
  } catch (err) {
    console.error('USSD route error:', err);
    res.set('Content-Type', 'text/plain');
    res.send('END Something went wrong. Try again.');
  }
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const PORT = Number(process.env.PORT) || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/event-vax';

(async () => {
  await connectDB(MONGODB_URI);
  app.listen(PORT, () => {
    console.log(`✅ Server ready on port ${PORT}`);
  });
})();

process.on('unhandledRejection', (err) => {
  console.error('Unhandled promise rejection:', err);
});