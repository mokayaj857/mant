#!/bin/bash

# Integration Test Script
# Tests communication between backend, frontend, and smart contracts

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0

# Load environment variables (skip comments and empty lines, only export valid KEY=VALUE pairs)
if [ -f .env ]; then
    while IFS= read -r line; do
        # Skip comments and empty lines
        [[ "$line" =~ ^[[:space:]]*# ]] && continue
        [[ -z "${line// }" ]] && continue
        # Only export lines with KEY=VALUE format
        if [[ "$line" =~ ^[[:space:]]*[A-Za-z_][A-Za-z0-9_]*= ]]; then
            export "$line" 2>/dev/null || true
        fi
    done < .env
fi

if [ -f server/.env ]; then
    while IFS= read -r line; do
        # Skip comments and empty lines
        [[ "$line" =~ ^[[:space:]]*# ]] && continue
        [[ -z "${line// }" ]] && continue
        # Only export lines with KEY=VALUE format
        if [[ "$line" =~ ^[[:space:]]*[A-Za-z_][A-Za-z0-9_]*= ]]; then
            export "$line" 2>/dev/null || true
        fi
    done < server/.env
fi

API_URL=${VITE_API_URL:-http://localhost:8080}
EXPECTED_CHAIN_ID=${VITE_EXPECTED_CHAIN_ID:-5001}

echo ""
echo "🧪 Starting Integration Tests..."
echo "============================================================"
echo ""

# Test function
test() {
    local name="$1"
    local command="$2"
    
    echo -n "Testing: $name... "
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}"
        ((FAILED++))
        return 1
    fi
}

# Test Backend Health
echo -e "${BLUE}📡 Testing Backend Health...${NC}"
echo "============================================================"

test "Backend server is running" "curl -s -f $API_URL/health | grep -q 'OK'"
if [ $? -eq 0 ]; then
    echo "   Server response: $(curl -s $API_URL/health | head -c 100)"
fi

test "Backend API is accessible" "curl -s -f $API_URL/api/contracts/config > /dev/null"

# Test Backend Configuration
echo ""
echo -e "${BLUE}⚙️  Testing Backend Configuration...${NC}"
echo "============================================================"

if [ -z "$CHAIN_ID" ]; then
    echo -e "${RED}❌ CHAIN_ID not set in backend .env${NC}"
    ((FAILED++))
else
    echo -e "${GREEN}✅ CHAIN_ID: $CHAIN_ID${NC}"
    ((PASSED++))
fi

if [ -z "$MANTLE_SIGNER_ADDRESS" ]; then
    echo -e "${RED}❌ MANTLE_SIGNER_ADDRESS not set in backend .env${NC}"
    ((FAILED++))
else
    echo -e "${GREEN}✅ MANTLE_SIGNER_ADDRESS: $MANTLE_SIGNER_ADDRESS${NC}"
    ((PASSED++))
fi

if [ -z "$MANTLE_PRIVATE_KEY" ]; then
    echo -e "${RED}❌ MANTLE_PRIVATE_KEY not set in backend .env${NC}"
    ((FAILED++))
else
    if [[ $MANTLE_PRIVATE_KEY == 0x* ]]; then
        echo -e "${GREEN}✅ MANTLE_PRIVATE_KEY is configured${NC}"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠️  MANTLE_PRIVATE_KEY should start with 0x${NC}"
        ((FAILED++))
    fi
fi

# Test Chain ID Match
if [ ! -z "$CHAIN_ID" ] && [ ! -z "$EXPECTED_CHAIN_ID" ]; then
    if [ "$CHAIN_ID" == "$EXPECTED_CHAIN_ID" ]; then
        echo -e "${GREEN}✅ Chain IDs match: $CHAIN_ID${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ Chain ID mismatch: Frontend expects $EXPECTED_CHAIN_ID, Backend uses $CHAIN_ID${NC}"
        ((FAILED++))
    fi
fi

# Test Contract Configuration
echo ""
echo -e "${BLUE}📋 Testing Contract Configuration...${NC}"
echo "============================================================"

CONFIG_RESPONSE=$(curl -s $API_URL/api/contracts/config)
if echo "$CONFIG_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Contract config endpoint returns data${NC}"
    ((PASSED++))
    
    # Extract values
    CONFIG_CHAIN_ID=$(echo "$CONFIG_RESPONSE" | grep -o '"chainId":[0-9]*' | grep -o '[0-9]*')
    CONFIG_AVARA=$(echo "$CONFIG_RESPONSE" | grep -o '"avaraCore":"[^"]*"' | cut -d'"' -f4)
    CONFIG_TICKET=$(echo "$CONFIG_RESPONSE" | grep -o '"ticketNFT":"[^"]*"' | cut -d'"' -f4)
    CONFIG_POAP=$(echo "$CONFIG_RESPONSE" | grep -o '"poapNFT":"[^"]*"' | cut -d'"' -f4)
    CONFIG_SIGNER=$(echo "$CONFIG_RESPONSE" | grep -o '"mantleSigner":"[^"]*"' | cut -d'"' -f4)
    
    echo "   Chain ID: $CONFIG_CHAIN_ID"
    echo "   AvaraCore: ${CONFIG_AVARA:-Not set}"
    echo "   TicketNFT: ${CONFIG_TICKET:-Not set}"
    echo "   POAPNFT: ${CONFIG_POAP:-Not set}"
    echo "   Mantle Signer: ${CONFIG_SIGNER:-Not set}"
else
    echo -e "${RED}❌ Contract config endpoint failed${NC}"
    ((FAILED++))
fi

# Check if addresses are configured
if [ ! -z "$AVARA_CORE_ADDRESS" ] || [ ! -z "$VITE_AVARA_CORE_ADDRESS" ]; then
    echo -e "${GREEN}✅ Contract addresses are configured${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️  Contract addresses not set (will be fetched from server)${NC}"
fi

# Test Mantle API
echo ""
echo -e "${BLUE}🔐 Testing Mantle API Endpoints...${NC}"
echo "============================================================"

MINT_RESPONSE=$(curl -s -X POST $API_URL/api/mantle/mint-proof \
    -H "Content-Type: application/json" \
    -d '{"to":"0x1234567890123456789012345678901234567890","eventId":1}')

if echo "$MINT_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Mantle mint-proof endpoint works${NC}"
    ((PASSED++))
    SIGNATURE=$(echo "$MINT_RESPONSE" | grep -o '"signature":"[^"]*"' | cut -d'"' -f4)
    SIGNER=$(echo "$MINT_RESPONSE" | grep -o '"signerAddress":"[^"]*"' | cut -d'"' -f4)
    echo "   Signature: ${SIGNATURE:0:20}..."
    echo "   Signer: $SIGNER"
else
    ERROR=$(echo "$MINT_RESPONSE" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
    if echo "$ERROR" | grep -q "MANTLE_PRIVATE_KEY"; then
        echo -e "${RED}❌ MANTLE_PRIVATE_KEY not configured on server${NC}"
    else
        echo -e "${RED}❌ Mint-proof endpoint failed: ${ERROR:-Unknown error}${NC}"
    fi
    ((FAILED++))
fi

CHECKIN_RESPONSE=$(curl -s -X POST $API_URL/api/mantle/checkin-proof \
    -H "Content-Type: application/json" \
    -d '{"ticketId":1,"eventId":1,"account":"0x1234567890123456789012345678901234567890"}')

if echo "$CHECKIN_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Mantle checkin-proof endpoint works${NC}"
    ((PASSED++))
else
    ERROR=$(echo "$CHECKIN_RESPONSE" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
    echo -e "${RED}❌ Checkin-proof endpoint failed: ${ERROR:-Unknown error}${NC}"
    ((FAILED++))
fi

# Test Frontend Configuration
echo ""
echo -e "${BLUE}🎨 Testing Frontend Configuration...${NC}"
echo "============================================================"

if [ -z "$EXPECTED_CHAIN_ID" ]; then
    echo -e "${RED}❌ VITE_EXPECTED_CHAIN_ID not set in frontend .env${NC}"
    ((FAILED++))
else
    echo -e "${GREEN}✅ VITE_EXPECTED_CHAIN_ID: $EXPECTED_CHAIN_ID${NC}"
    ((PASSED++))
fi

echo "   API URL: $API_URL"

# Check ABI files
if [ -f "src/abi/AvaraCore.json" ] && [ -f "src/abi/TicketNFT.json" ] && [ -f "src/abi/POAPNFT.json" ]; then
    echo -e "${GREEN}✅ All ABI files found${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ ABI files missing${NC}"
    ((FAILED++))
fi

# Summary
echo ""
echo "============================================================"
echo -e "${BLUE}📊 Test Summary${NC}"
echo "============================================================"
echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"
echo -e "${BLUE}📈 Total: $((PASSED + FAILED))${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! Your setup is ready.${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please check the errors above.${NC}"
    exit 1
fi

