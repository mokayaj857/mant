require('dotenv').config();
const https = require('https');
const http = require('http');
const url = require('url');
const { ethers } = require('ethers');

// Configuration
const SERVER_API_URL = process.env.SERVER_API_URL || 'http://localhost:8080';
const RPC_URL = process.env.RPC_URL || process.env.CHAIN_RPC_URL || 'https://api.avax.network/ext/bc/C/rpc';
const AVARA_CORE_ADDRESS = process.env.AVARA_CORE_ADDRESS || '';
const KRNL_PRIVATE_KEY = process.env.KRNL_PRIVATE_KEY || '';

// Helper function to make HTTP requests
function makeRequest(urlStr, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = url.parse(urlStr);
    const client = parsed.protocol === 'https:' ? https : http;
    const postData = options.body ? JSON.stringify(options.body) : '';
    
    const req = client.request({
      ...parsed,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(postData && { 'Content-Length': Buffer.byteLength(postData) }),
        ...options.headers
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            json: () => Promise.resolve(JSON.parse(data)),
            text: () => Promise.resolve(data)
          });
        } catch (e) {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            json: () => Promise.reject(e),
            text: () => Promise.resolve(data)
          });
        }
      });
    });
    
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function testServerConnection() {
  console.log('\n🔍 Testing Server Connection...');
  console.log('='.repeat(50));
  
  try {
    // Test 1: Health check
    console.log('\n1. Testing /health endpoint...');
    const healthRes = await makeRequest(`${SERVER_API_URL}/health`);
    if (healthRes.ok) {
      const healthData = await healthRes.json();
      console.log('✅ Server is running:', healthData);
    } else {
      console.log('❌ Server health check failed:', healthRes.status);
      return false;
    }
    
    // Test 2: Fetch events
    console.log('\n2. Testing /api/events endpoint...');
    const eventsRes = await makeRequest(`${SERVER_API_URL}/api/events`);
    if (eventsRes.ok) {
      const eventsData = await eventsRes.json();
      console.log('✅ Events fetched successfully');
      console.log(`   - Success: ${eventsData.success}`);
      console.log(`   - Count: ${eventsData.count || eventsData.data?.length || 0}`);
      if (eventsData.data && eventsData.data.length > 0) {
        console.log(`   - First event: ${eventsData.data[0].event_name || eventsData.data[0].name}`);
        console.log(`   - Event ID: ${eventsData.data[0].id}`);
        console.log(`   - Price: ${eventsData.data[0].regular_price || eventsData.data[0].price || 'N/A'}`);
      } else {
        console.log('   ⚠️  No events found in database');
      }
    } else {
      console.log('❌ Failed to fetch events:', eventsRes.status);
      const errorText = await eventsRes.text();
      console.log('   Error:', errorText);
      return false;
    }
    
    // Test 3: Fetch contract config
    console.log('\n3. Testing /api/contracts/config endpoint...');
    const configRes = await makeRequest(`${SERVER_API_URL}/api/contracts/config`);
    if (configRes.ok) {
      const configData = await configRes.json();
      console.log('✅ Contract config fetched successfully');
      console.log(`   - Success: ${configData.success}`);
      if (configData.data) {
        console.log(`   - AvaraCore: ${configData.data.avaraCore || 'Not configured'}`);
        console.log(`   - TicketNFT: ${configData.data.ticketNFT || 'Not configured'}`);
        console.log(`   - POAPNFT: ${configData.data.poapNFT || 'Not configured'}`);
        console.log(`   - KRNL Signer: ${configData.data.krnlSigner || 'Not configured'}`);
        console.log(`   - Chain ID: ${configData.data.chainId || 'Not configured'}`);
      }
    } else {
      console.log('❌ Failed to fetch contract config:', configRes.status);
      const errorText = await configRes.text();
      console.log('   Error:', errorText);
    }
    
    return true;
  } catch (error) {
    console.log('❌ Server connection test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('   💡 Server is not running. Start it with: cd ../server && npm start');
    }
    return false;
  }
}

async function testSmartContractConnection() {
  console.log('\n🔍 Testing Smart Contract Connection...');
  console.log('='.repeat(50));
  
  if (!RPC_URL) {
    console.log('⚠️  RPC_URL not configured, skipping contract tests');
    return false;
  }
  
  try {
    console.log('\n1. Testing RPC connection...');
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const blockNumber = await provider.getBlockNumber();
    console.log(`✅ RPC connection successful`);
    console.log(`   - Current block: ${blockNumber}`);
    
    const network = await provider.getNetwork();
    console.log(`   - Chain ID: ${Number(network.chainId)}`);
    console.log(`   - Network: ${network.name || 'Unknown'}`);
    
    if (AVARA_CORE_ADDRESS) {
      console.log('\n2. Testing AvaraCore contract...');
      try {
        // Minimal ABI to check if contract exists
        const code = await provider.getCode(AVARA_CORE_ADDRESS);
        if (code && code !== '0x') {
          console.log(`✅ Contract deployed at: ${AVARA_CORE_ADDRESS}`);
          
          // Try to get contract info
          const AvaraCoreABI = [
            "function krnlSigner() view returns (address)"
          ];
          const contract = new ethers.Contract(AVARA_CORE_ADDRESS, AvaraCoreABI, provider);
          const signer = await contract.krnlSigner();
          console.log(`   - KRNL Signer: ${signer}`);
        } else {
          console.log(`❌ No contract found at: ${AVARA_CORE_ADDRESS}`);
        }
      } catch (error) {
        console.log(`⚠️  Error checking contract: ${error.message}`);
      }
    } else {
      console.log('⚠️  AVARA_CORE_ADDRESS not configured');
    }
    
    if (KRNL_PRIVATE_KEY) {
      console.log('\n3. Testing wallet/signer...');
      try {
        const wallet = new ethers.Wallet(KRNL_PRIVATE_KEY, provider);
        const address = await wallet.getAddress();
        const balance = await provider.getBalance(address);
        console.log(`✅ Wallet initialized`);
        console.log(`   - Address: ${address}`);
        console.log(`   - Balance: ${ethers.formatEther(balance)} ETH/AVAX`);
      } catch (error) {
        console.log(`❌ Wallet initialization failed: ${error.message}`);
      }
    } else {
      console.log('⚠️  KRNL_PRIVATE_KEY not configured');
    }
    
    return true;
  } catch (error) {
    console.log('❌ Smart contract connection test failed:', error.message);
    if (error.code === 'ECONNREFUSED' || error.message.includes('timeout')) {
      console.log('   💡 RPC endpoint is not reachable. Check your RPC_URL configuration.');
    }
    return false;
  }
}

async function testSMSATIntegration() {
  console.log('\n🔍 Testing SMS_AT Integration Functions...');
  console.log('='.repeat(50));
  
  // Test fetchEventsFromServer function logic
  console.log('\n1. Testing event fetching logic...');
  try {
    const eventsRes = await makeRequest(`${SERVER_API_URL}/api/events`);
    if (eventsRes.ok) {
      const result = await eventsRes.json();
      if (result.success && result.data) {
        const events = result.data.map((event, index) => ({
          id: event.id.toString(),
          name: event.event_name,
          price: parseFloat(event.regular_price || event.vip_price || event.vvip_price || 0),
          venue: event.venue,
          date: event.event_date,
          description: event.description,
          index: index + 1
        }));
        console.log(`✅ Event mapping successful`);
        console.log(`   - Mapped ${events.length} events`);
        if (events.length > 0) {
          console.log(`   - Example: ${events[0].name} (${events[0].price} KES)`);
        }
      }
    }
  } catch (error) {
    console.log(`❌ Event fetching logic failed: ${error.message}`);
  }
  
  // Test KRNL mint-proof endpoint
  console.log('\n2. Testing KRNL mint-proof endpoint...');
  if (KRNL_PRIVATE_KEY) {
    try {
      const wallet = new ethers.Wallet(KRNL_PRIVATE_KEY);
      const testAddress = await wallet.getAddress();
      
      const krnlRes = await makeRequest(`${SERVER_API_URL}/api/krnl/mint-proof`, {
        method: 'POST',
        body: {
          to: testAddress,
          eventId: 1
        }
      });
      
      if (krnlRes.ok) {
        const krnlData = await krnlRes.json();
        if (krnlData.success && krnlData.data) {
          console.log(`✅ KRNL mint-proof successful`);
          console.log(`   - Timestamp: ${krnlData.data.timestamp}`);
          console.log(`   - Nonce: ${krnlData.data.nonce}`);
          console.log(`   - Signature: ${krnlData.data.signature.substring(0, 20)}...`);
          console.log(`   - Signer: ${krnlData.data.signerAddress}`);
        }
      } else {
        const errorText = await krnlRes.text();
        console.log(`❌ KRNL mint-proof failed: ${errorText}`);
      }
    } catch (error) {
      console.log(`❌ KRNL mint-proof test failed: ${error.message}`);
    }
  } else {
    console.log('⚠️  KRNL_PRIVATE_KEY not configured, skipping KRNL test');
  }
}

async function runAllTests() {
  console.log('\n🚀 Starting SMS_AT Connection Tests');
  console.log('='.repeat(50));
  console.log(`Server URL: ${SERVER_API_URL}`);
  console.log(`RPC URL: ${RPC_URL}`);
  console.log(`AvaraCore: ${AVARA_CORE_ADDRESS || 'Not configured'}`);
  console.log(`KRNL Key: ${KRNL_PRIVATE_KEY ? 'Configured' : 'Not configured'}`);
  
  const serverOk = await testServerConnection();
  const contractOk = await testSmartContractConnection();
  await testSMSATIntegration();
  
  console.log('\n📊 Test Summary');
  console.log('='.repeat(50));
  console.log(`Server Connection: ${serverOk ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Contract Connection: ${contractOk ? '✅ PASS' : '⚠️  WARN'}`);
  console.log('\n');
}

runAllTests().catch(console.error);

