# 🚀 Quick Start Guide

## ✅ Current Status

Your frontend dev server is now running! Here's what you need to know:

### Frontend
- **Status**: ✅ Running
- **URL**: http://localhost:5173/
- **Port**: 5173

### Backend
- **Expected URL**: http://localhost:8080
- **API Proxy**: Configured in `vite.config.js` to forward `/api/*` requests to backend

## 🔧 Setup Checklist

### 1. Start Backend Server (if not running)

```bash
cd event-vax/server
npm install  # If not already done
npm start   # or node server.js
```

### 2. Verify Environment Variables

**Frontend** (`event-vax/.env`):
```bash
VITE_EXPECTED_CHAIN_ID=11155111  # Match your deployed network
VITE_API_URL=http://localhost:8080
```

**Backend** (`event-vax/server/.env`):
```bash
CHAIN_ID=11155111
AVARA_CORE_ADDRESS=0x5F9F8883C67d68B79a5779339a48237B9A3325EB
TICKET_NFT_ADDRESS=0xbb2853a001A47a25f5f0392A5E7cDBFa90448945
POAP_NFT_ADDRESS=0x7d552D09B4468583CaFda67d3057E62711CF7131
MANTLE_SIGNER_ADDRESS=0xYourSignerAddress  # ⚠️ Still needs to be set
MANTLE_PRIVATE_KEY=0xYourPrivateKey         # ⚠️ Still needs to be set
```

### 3. Test the Connection

Run the integration test:
```bash
cd event-vax
./test-connection.sh
```

## 🌐 Access Your Application

1. **Frontend**: Open http://localhost:5173/ in your browser
2. **Backend API**: http://localhost:8080/api/contracts/config
3. **Health Check**: http://localhost:8080/health

## 📝 Next Steps

1. **Fix Chain ID**: Update frontend `.env` to use `11155111` (Mantle Sepolia)
2. **Add Mantle Signer**: Add `MANTLE_SIGNER_ADDRESS` and `MANTLE_PRIVATE_KEY` to backend `.env`
3. **Restart Backend**: After updating `.env`, restart the backend server
4. **Test**: Run `./test-connection.sh` to verify everything works

## 🐛 Troubleshooting

### Frontend won't start
- Run `npm install` in the `event-vax` directory
- Check for port conflicts (5173)

### Backend not responding
- Check if server is running: `curl http://localhost:8080/health`
- Verify environment variables are set correctly
- Check server logs for errors

### Contract connection issues
- Verify contract addresses in backend `.env`
- Check network matches (Chain ID 11155111)
- Ensure Mantle signer is configured

## 📚 Documentation

- `FIX_REQUIRED.md` - Issues that need to be fixed
- `TEST_RESULTS.md` - Latest test results
- `ENV_SETUP_GUIDE.md` - Environment variable guide
- `FRONTEND_CONTRACT_SETUP.md` - Frontend integration guide

