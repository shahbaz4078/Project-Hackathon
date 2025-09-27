# Blockchain Supply Chain App

A decentralized supply chain tracking application built with Ethereum smart contracts, IPFS, and React.

## Project Structure

```
blockchain-app/
├── contracts/          # Smart contracts (Hardhat)
├── web/                # Frontend (React + Vite)
├── api/                # Backend API (Node.js + Express)
└── README.md
```

## Quick Start

### Prerequisites
- Node.js 18+
- MetaMask wallet
- Polygon testnet MATIC tokens

### Installation
```bash
# Install dependencies for all packages
npm run install:all

# Set up environment variables
cp contracts/.env.example contracts/.env
cp api/.env.example api/.env
cp web/.env.example web/.env
```

### Development
```bash
# Start local blockchain
npm run blockchain:start

# Deploy contracts
npm run contracts:deploy

# Start backend API
npm run api:dev

# Start frontend
npm run web:dev

# Run full demo
npm run demo
```

### Build & Deploy
```bash
# Build all packages
npm run build

# Deploy to testnet
npm run deploy:testnet

# Deploy frontend
npm run deploy:web
```

## Scripts

- `npm run install:all` - Install dependencies for all packages
- `npm run blockchain:start` - Start local Hardhat node
- `npm run contracts:compile` - Compile smart contracts
- `npm run contracts:deploy` - Deploy contracts to network
- `npm run contracts:test` - Run contract tests
- `npm run api:dev` - Start API in development mode
- `npm run web:dev` - Start frontend in development mode
- `npm run demo` - Run end-to-end demo with sample data
- `npm run build` - Build all packages for production
- `npm run deploy:testnet` - Deploy contracts to Polygon testnet
- `npm run deploy:web` - Deploy frontend to Vercel

## Environment Variables

### Contracts (.env)
```
POLYGON_RPC_URL=https://rpc-mumbai.maticvigil.com
PRIVATE_KEY=your_private_key_here
POLYGONSCAN_API_KEY=your_polygonscan_api_key
```

### API (.env)
```
PORT=3001
CONTRACT_ADDRESS=deployed_contract_address
POLYGON_RPC_URL=https://rpc-mumbai.maticvigil.com
PRIVATE_KEY=your_private_key_here
IPFS_API_KEY=your_pinata_api_key
IPFS_SECRET=your_pinata_secret
MONGODB_URI=mongodb://localhost:27017/supplychain
```

### Web (.env)
```
VITE_API_URL=http://localhost:3001
VITE_CONTRACT_ADDRESS=deployed_contract_address
VITE_CHAIN_ID=80001
```

## Features

- **Smart Contract**: Product lifecycle tracking with roles and events
- **IPFS Integration**: Decentralized metadata storage
- **QR Code System**: Product scanning and verification
- **Multi-Role Support**: Farmer, Distributor, Retailer, Consumer
- **Real-time Updates**: Product status and price tracking
- **Wallet Integration**: MetaMask connection with wagmi
- **Responsive UI**: Mobile-friendly React interface

## Demo Flow

1. **Farmer**: Register new product with details
2. **Distributor**: Update product status and add pricing
3. **Retailer**: Final status update and consumer pricing
4. **Consumer**: Scan QR code to view product history

## Deployment URLs

- **Frontend**: https://your-app.vercel.app
- **API**: https://your-api.railway.app
- **Contract**: Polygon Mumbai Testnet
