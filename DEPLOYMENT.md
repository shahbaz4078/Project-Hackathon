# Deployment Guide

## Prerequisites

1. **Node.js 18+** installed
2. **MetaMask** wallet with Polygon Mumbai testnet configured
3. **Polygon Mumbai MATIC** tokens for gas fees
4. **Pinata IPFS** account for metadata storage
5. **MongoDB** (optional, for caching)

## Environment Setup

### 1. Get Polygon Mumbai Testnet MATIC
- Visit [Polygon Faucet](https://faucet.polygon.technology/)
- Connect your MetaMask wallet
- Request test MATIC tokens

### 2. Get Pinata API Keys
- Sign up at [Pinata](https://pinata.cloud/)
- Go to API Keys section
- Create new API key with pinning permissions
- Save API Key and Secret Key

### 3. Get RPC URL
- Use public RPC: `https://rpc-mumbai.maticvigil.com`
- Or get from [Alchemy](https://www.alchemy.com/) or [Infura](https://infura.io/)

## Local Development

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Configure Environment Variables

**contracts/.env**
```
POLYGON_RPC_URL=https://rpc-mumbai.maticvigil.com
PRIVATE_KEY=your_private_key_here
POLYGONSCAN_API_KEY=your_polygonscan_api_key
```

**api/.env**
```
PORT=3001
CONTRACT_ADDRESS=deployed_contract_address
POLYGON_RPC_URL=https://rpc-mumbai.maticvigil.com
PRIVATE_KEY=your_private_key_here
IPFS_API_KEY=your_pinata_api_key
IPFS_SECRET=your_pinata_secret
MONGODB_URI=mongodb://localhost:27017/supplychain
```

**web/.env**
```
VITE_API_URL=http://localhost:3001
VITE_CONTRACT_ADDRESS=deployed_contract_address
VITE_CHAIN_ID=80001
```

### 3. Start Local Development

**Terminal 1: Start Local Blockchain (Optional)**
```bash
npm run blockchain:start
```

**Terminal 2: Deploy Contracts**
```bash
# For local development
npm run contracts:deploy

# For testnet
npm run deploy:testnet
```

**Terminal 3: Start API Server**
```bash
npm run api:dev
```

**Terminal 4: Start Frontend**
```bash
npm run web:dev
```

### 4. Run Demo
```bash
npm run demo
```

## Production Deployment

### 1. Deploy Smart Contract to Polygon Mumbai

```bash
cd contracts
npx hardhat run scripts/deploy.js --network polygon
```

Save the deployed contract address and update environment variables.

### 2. Deploy Backend API

**Option A: Railway**
1. Connect GitHub repository to [Railway](https://railway.app/)
2. Set environment variables in Railway dashboard
3. Deploy from `api` folder

**Option B: Render**
1. Connect GitHub repository to [Render](https://render.com/)
2. Create new Web Service
3. Set build command: `cd api && npm install`
4. Set start command: `cd api && npm start`

**Option C: Heroku**
```bash
cd api
heroku create your-supply-chain-api
heroku config:set NODE_ENV=production
heroku config:set CONTRACT_ADDRESS=your_contract_address
# Set other environment variables
git push heroku main
```

### 3. Deploy Frontend

**Option A: Vercel**
```bash
cd web
npm install -g vercel
vercel --prod
```

**Option B: Netlify**
```bash
cd web
npm run build
# Upload dist folder to Netlify or connect GitHub
```

**Option C: GitHub Pages**
```bash
cd web
npm run build
# Deploy dist folder to gh-pages branch
```

### 4. Configure Production Environment Variables

Update all environment files with production URLs:

**api/.env (production)**
```
PORT=3001
CONTRACT_ADDRESS=0x...deployed_address
POLYGON_RPC_URL=https://rpc-mumbai.maticvigil.com
PRIVATE_KEY=your_private_key
IPFS_API_KEY=your_pinata_api_key
IPFS_SECRET=your_pinata_secret
MONGODB_URI=your_mongodb_atlas_uri
```

**web/.env (production)**
```
VITE_API_URL=https://your-api.railway.app
VITE_CONTRACT_ADDRESS=0x...deployed_address
VITE_CHAIN_ID=80001
```

## Verification

### 1. Contract Verification
```bash
cd contracts
npx hardhat verify --network polygon DEPLOYED_CONTRACT_ADDRESS
```

### 2. Test Full Flow
1. Connect MetaMask to Polygon Mumbai
2. Visit your deployed frontend
3. Register a product as Farmer
4. Update status as Distributor/Retailer
5. Scan QR code as Consumer

## Monitoring & Maintenance

### 1. Monitor Contract Events
- Use [Polygonscan Mumbai](https://mumbai.polygonscan.com/)
- Set up event monitoring for ProductRegistered, StatusUpdated, PriceUpdated

### 2. API Health Checks
- Monitor `/health` endpoint
- Set up alerts for downtime

### 3. IPFS Monitoring
- Monitor Pinata usage and limits
- Backup important metadata

## Troubleshooting

### Common Issues

**1. Transaction Fails**
- Check gas limits and prices
- Ensure sufficient MATIC balance
- Verify contract permissions

**2. IPFS Upload Fails**
- Check Pinata API keys
- Verify JSON schema validation
- Check file size limits

**3. Frontend Connection Issues**
- Verify MetaMask network (Chain ID: 80001)
- Check contract address in environment
- Ensure API is running and accessible

**4. API Errors**
- Check environment variables
- Verify contract ABI matches deployed contract
- Check MongoDB connection (if used)

### Getting Help

1. Check contract events on Polygonscan
2. Review API logs for errors
3. Test individual components separately
4. Verify all environment variables are set correctly

## Security Considerations

1. **Never commit private keys** to version control
2. **Use environment variables** for all sensitive data
3. **Implement rate limiting** on API endpoints
4. **Validate all inputs** on both frontend and backend
5. **Use HTTPS** for all production deployments
6. **Regular security audits** of smart contracts

## Cost Estimation

### Development Costs
- Contract deployment: ~0.01 MATIC
- Product registration: ~0.005 MATIC per product
- Status updates: ~0.003 MATIC per update
- Price updates: ~0.003 MATIC per update

### Monthly Operating Costs
- Pinata IPFS: $0-20/month (depending on usage)
- API hosting: $0-25/month (Railway/Render free tier available)
- Frontend hosting: $0 (Vercel/Netlify free tier)
- MongoDB: $0-9/month (Atlas free tier available)

**Total estimated monthly cost: $0-54/month**
