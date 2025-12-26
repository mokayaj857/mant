# 🚨 URGENT: Fix Contract Addresses in Backend

## Problem

The server API is returning `null` for all contract addresses:
```json
{
  "avaraCore": null,
  "ticketNFT": null,
  "poapNFT": null
}
```

This is why the frontend can't connect to contracts!

## Fix

Add these to `event-vax/server/.env`:

```bash
AVARA_CORE_ADDRESS=0x5F9F8883C67d68B79a5779339a48237B9A3325EB
TICKET_NFT_ADDRESS=0xbb2853a001A47a25f5f0392A5E7cDBFa90448945
POAP_NFT_ADDRESS=0x7d552D09B4468583CaFda67d3057E62711CF7131
```

## Also Fix Chain ID

Your server is returning chainId `5001` but contracts are on `11155111`. Update:

```bash
CHAIN_ID=11155111
```

## Quick Fix Command

```bash
cd /home/junia-loves-juniour/code/joe/event-vax/server

# Add contract addresses
cat >> .env << 'EOF'
AVARA_CORE_ADDRESS=0x5F9F8883C67d68B79a5779339a48237B9A3325EB
TICKET_NFT_ADDRESS=0xbb2853a001A47a25f5f0392A5E7cDBFa90448945
POAP_NFT_ADDRESS=0x7d552D09B4468583CaFda67d3057E62711CF7131
CHAIN_ID=11155111
EOF

# Restart your backend server
```

After restarting, the frontend should be able to fetch contract addresses!

