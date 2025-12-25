#!/usr/bin/env node

/**
 * Integration Test Script
 * Tests communication between backend, frontend, and smart contracts
 */

import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const frontendEnv = dotenv.config({ path: join(__dirname, '.env') });
const backendEnv = dotenv.config({ path: join(__dirname, 'server', '.env') });

const API_URL = process.env.VITE_API_URL || frontendEnv.parsed?.VITE_API_URL || 'http://localhost:8080';
const EXPECTED_CHAIN_ID = Number(process.env.VITE_EXPECTED_CHAIN_ID || frontendEnv.parsed?.VITE_EXPECTED_CHAIN_ID || 5001);

// Backend env vars
const CHAIN_ID = Number(process.env.CHAIN_ID || backendEnv.parsed?.CHAIN_ID || 5001);
const AVARA_CORE_ADDRESS = process.env.AVARA_CORE_ADDRESS || backendEnv.parsed?.AVARA_CORE_ADDRESS;
const TICKET_NFT_ADDRESS = process.env.TICKET_NFT_ADDRESS || backendEnv.parsed?.TICKET_NFT_ADDRESS;
const POAP_NFT_ADDRESS = process.env.POAP_NFT_ADDRESS || backendEnv.parsed?.POAP_NFT_ADDRESS;
const MANTLE_SIGNER_ADDRESS = process.env.MANTLE_SIGNER_ADDRESS || backendEnv.parsed?.MANTLE_SIGNER_ADDRESS;
const MANTLE_PRIVATE_KEY = process.env.MANTLE_PRIVATE_KEY || backendEnv.parsed?.MANTLE_PRIVATE_KEY;

// Frontend env vars
const VITE_AVARA_CORE_ADDRESS = frontendEnv.parsed?.VITE_AVARA_CORE_ADDRESS;
const VITE_TICKET_NFT_ADDRESS = frontendEnv.parsed?.VITE_TICKET_NFT_ADDRESS;
const VITE_POAP_NFT_ADDRESS = frontendEnv.parsed?.VITE_POAP_NFT_ADDRESS;

let testsPassed = 0;
let testsFailed = 0;
const results = [];

function log(message, type = 'info') {
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  };
  console.log(`${icons[type] || ''} ${message}`);
}

function test(name, fn) {
  try {
    const result = fn();
    if (result instanceof Promise) {
      return result.then(
        () => {
          log(`${name}`, 'success');
          testsPassed++;
          results.push({ name, status: 'PASS' });
        },
        (error) => {
          log(`${name}: ${error.message}`, 'error');
          testsFailed++;
          results.push({ name, status: 'FAIL', error: error.message });
        }
      );
    } else {
      log(`${name}`, 'success');
      testsPassed++;
      results.push({ name, status: 'PASS' });
    }
  } catch (error) {
    log(`${name}: ${error.message}`, 'error');
    testsFailed++;
    results.push({ name, status: 'FAIL', error: error.message });
  }
}

async function testBackendHealth() {
  log('\n📡 Testing Backend Health...', 'info');
  console.log('='.repeat(60));

  test('Backend server is running', async () => {
    const response = await fetch(`${API_URL}/health`);
    if (!response.ok) throw new Error(`Server returned ${response.status}`);
    const data = await response.json();
    if (data.status !== 'OK') throw new Error('Server health check failed');
  });

  test('Backend API is accessible', async () => {
    const response = await fetch(`${API_URL}/api/contracts/config`);
    if (!response.ok) throw new Error(`API returned ${response.status}`);
  });
}

async function testBackendConfig() {
  log('\n⚙️  Testing Backend Configuration...', 'info');
  console.log('='.repeat(60));

  test('CHAIN_ID is configured', () => {
    if (!CHAIN_ID) throw new Error('CHAIN_ID not set in backend .env');
    log(`   Chain ID: ${CHAIN_ID}`, 'info');
  });

  test('MANTLE_SIGNER_ADDRESS is configured', () => {
    if (!MANTLE_SIGNER_ADDRESS) throw new Error('MANTLE_SIGNER_ADDRESS not set in backend .env');
    log(`   Mantle Signer: ${MANTLE_SIGNER_ADDRESS}`, 'info');
  });

  test('MANTLE_PRIVATE_KEY is configured', () => {
    if (!MANTLE_PRIVATE_KEY) throw new Error('MANTLE_PRIVATE_KEY not set in backend .env');
    if (!MANTLE_PRIVATE_KEY.startsWith('0x')) throw new Error('MANTLE_PRIVATE_KEY should start with 0x');
    log(`   Private Key: ${MANTLE_PRIVATE_KEY.substring(0, 10)}...`, 'info');
  });

  test('Chain IDs match between frontend and backend', () => {
    if (CHAIN_ID !== EXPECTED_CHAIN_ID) {
      throw new Error(`Chain ID mismatch: Frontend expects ${EXPECTED_CHAIN_ID}, Backend uses ${CHAIN_ID}`);
    }
  });
}

async function testContractConfig() {
  log('\n📋 Testing Contract Configuration...', 'info');
  console.log('='.repeat(60));

  test('Contract config endpoint returns data', async () => {
    const response = await fetch(`${API_URL}/api/contracts/config`);
    const data = await response.json();
    if (!data.success) throw new Error('Config endpoint returned error');
    if (!data.data) throw new Error('Config endpoint returned no data');
    log(`   Chain ID: ${data.data.chainId}`, 'info');
    log(`   AvaraCore: ${data.data.avaraCore || 'Not set'}`, 'info');
    log(`   TicketNFT: ${data.data.ticketNFT || 'Not set'}`, 'info');
    log(`   POAPNFT: ${data.data.poapNFT || 'Not set'}`, 'info');
    log(`   Mantle Signer: ${data.data.mantleSigner || 'Not set'}`, 'info');
  });

  test('Contract addresses are configured (backend or frontend)', () => {
    const hasBackendAddresses = AVARA_CORE_ADDRESS && TICKET_NFT_ADDRESS && POAP_NFT_ADDRESS;
    const hasFrontendAddresses = VITE_AVARA_CORE_ADDRESS && VITE_TICKET_NFT_ADDRESS && VITE_POAP_NFT_ADDRESS;
    
    if (!hasBackendAddresses && !hasFrontendAddresses) {
      log('   ⚠️  Contract addresses not set (will be fetched from server)', 'warning');
    } else {
      if (hasBackendAddresses) log('   ✅ Contract addresses set in backend', 'success');
      if (hasFrontendAddresses) log('   ✅ Contract addresses set in frontend', 'success');
    }
  });
}

async function testMantleAPI() {
  log('\n🔐 Testing Mantle API Endpoints...', 'info');
  console.log('='.repeat(60));

  test('Mantle mint-proof endpoint is accessible', async () => {
    const testAddress = '0x1234567890123456789012345678901234567890';
    const response = await fetch(`${API_URL}/api/mantle/mint-proof`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: testAddress,
        eventId: 1
      })
    });

    if (!response.ok) {
      const error = await response.json();
      if (error.error?.includes('MANTLE_PRIVATE_KEY')) {
        throw new Error('MANTLE_PRIVATE_KEY not configured on server');
      }
      throw new Error(`Endpoint returned ${response.status}: ${error.error || response.statusText}`);
    }

    const data = await response.json();
    if (!data.success) throw new Error('Mint proof generation failed');
    if (!data.data.signature) throw new Error('No signature returned');
    log(`   ✅ Signature generated: ${data.data.signature.substring(0, 20)}...`, 'success');
    log(`   ✅ Signer address: ${data.data.signerAddress}`, 'success');
  });

  test('Mantle checkin-proof endpoint is accessible', async () => {
    const testAddress = '0x1234567890123456789012345678901234567890';
    const response = await fetch(`${API_URL}/api/mantle/checkin-proof`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ticketId: 1,
        eventId: 1,
        account: testAddress
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Endpoint returned ${response.status}: ${error.error || response.statusText}`);
    }

    const data = await response.json();
    if (!data.success) throw new Error('Checkin proof generation failed');
    if (!data.data.signature) throw new Error('No signature returned');
    log(`   ✅ Checkin signature generated`, 'success');
  });
}

async function testContractConnection() {
  log('\n🔗 Testing Smart Contract Connection...', 'info');
  console.log('='.repeat(60));

  // Determine RPC URL based on chain ID
  let rpcUrl;
  if (CHAIN_ID === 5001) {
    rpcUrl = 'https://rpc.testnet.mantle.xyz';
  } else if (CHAIN_ID === 5000) {
    rpcUrl = 'https://rpc.mantle.xyz';
  } else if (CHAIN_ID === 11155111) {
    rpcUrl = 'https://rpc.sepolia.mantle.xyz';
  } else {
    log('   ⚠️  Unknown chain ID, skipping contract tests', 'warning');
    return;
  }

  test('RPC endpoint is accessible', async () => {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const blockNumber = await provider.getBlockNumber();
    log(`   ✅ Connected to network`, 'success');
    log(`   Current block: ${blockNumber}`, 'info');
    
    const network = await provider.getNetwork();
    log(`   Chain ID: ${Number(network.chainId)}`, 'info');
    
    if (Number(network.chainId) !== CHAIN_ID) {
      throw new Error(`Chain ID mismatch: Expected ${CHAIN_ID}, got ${Number(network.chainId)}`);
    }
  });

  // Test contract if address is available
  const contractAddress = AVARA_CORE_ADDRESS || VITE_AVARA_CORE_ADDRESS;
  if (contractAddress) {
    test('AvaraCore contract is deployed', async () => {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const code = await provider.getCode(contractAddress);
      if (!code || code === '0x') {
        throw new Error(`No contract found at ${contractAddress}`);
      }
      log(`   ✅ Contract deployed at: ${contractAddress}`, 'success');
    });

    test('AvaraCore contract is accessible', async () => {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const minimalABI = [
        "function mantleSigner() view returns (address)",
        "function poaps() view returns (address)",
        "function tickets() view returns (address)"
      ];
      const contract = new ethers.Contract(contractAddress, minimalABI, provider);
      
      try {
        const signer = await contract.mantleSigner();
        log(`   ✅ Mantle Signer: ${signer}`, 'success');
        
        if (MANTLE_SIGNER_ADDRESS && signer.toLowerCase() !== MANTLE_SIGNER_ADDRESS.toLowerCase()) {
          log(`   ⚠️  Warning: Contract signer (${signer}) doesn't match configured signer (${MANTLE_SIGNER_ADDRESS})`, 'warning');
        }
        
        const poapsAddress = await contract.poaps();
        log(`   ✅ POAPNFT: ${poapsAddress}`, 'success');
        
        const ticketsAddress = await contract.tickets();
        log(`   ✅ TicketNFT: ${ticketsAddress}`, 'success');
      } catch (error) {
        throw new Error(`Failed to read contract: ${error.message}`);
      }
    });
  } else {
    log('   ⚠️  Contract address not configured, skipping contract tests', 'warning');
  }
}

async function testFrontendConfig() {
  log('\n🎨 Testing Frontend Configuration...', 'info');
  console.log('='.repeat(60));

  test('VITE_EXPECTED_CHAIN_ID is configured', () => {
    if (!EXPECTED_CHAIN_ID) throw new Error('VITE_EXPECTED_CHAIN_ID not set in frontend .env');
    log(`   Expected Chain ID: ${EXPECTED_CHAIN_ID}`, 'info');
  });

  test('VITE_API_URL is configured', () => {
    log(`   API URL: ${API_URL}`, 'info');
  });

  // Check if ABI files exist
  test('Contract ABIs are available', () => {
    const abiPath = join(__dirname, 'src', 'abi');
    try {
      const avaraABI = readFileSync(join(abiPath, 'AvaraCore.json'), 'utf-8');
      const ticketABI = readFileSync(join(abiPath, 'TicketNFT.json'), 'utf-8');
      const poapABI = readFileSync(join(abiPath, 'POAPNFT.json'), 'utf-8');
      log(`   ✅ All ABI files found`, 'success');
    } catch (error) {
      throw new Error(`ABI files missing: ${error.message}`);
    }
  });
}

async function runAllTests() {
  console.log('\n🧪 Starting Integration Tests...\n');
  console.log('='.repeat(60));
  
  try {
    await testBackendHealth();
    await testBackendConfig();
    await testContractConfig();
    await testMantleAPI();
    await testContractConnection();
    await testFrontendConfig();
  } catch (error) {
    log(`Fatal error: ${error.message}`, 'error');
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  log('\n📊 Test Summary', 'info');
  console.log('='.repeat(60));
  log(`✅ Passed: ${testsPassed}`, 'success');
  log(`❌ Failed: ${testsFailed}`, testsFailed > 0 ? 'error' : 'success');
  log(`📈 Total: ${testsPassed + testsFailed}`, 'info');

  if (testsFailed > 0) {
    console.log('\n❌ Failed Tests:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`   - ${r.name}: ${r.error}`);
    });
    process.exit(1);
  } else {
    log('\n🎉 All tests passed! Your setup is ready.', 'success');
    process.exit(0);
  }
}

runAllTests();

