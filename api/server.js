const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const { ethers } = require('ethers');
require('dotenv').config();

const IPFSService = require('../ipfs');
const contractABI = require('./abi/SupplyChain.json');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Initialize services
const ipfsService = new IPFSService({
  apiKey: process.env.IPFS_API_KEY,
  secret: process.env.IPFS_SECRET
});

// Blockchain connection
const provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractABI, wallet);

// MongoDB connection (optional cache)
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log('MongoDB connection error:', err));
}

// Product cache schema (optional)
const productSchema = new mongoose.Schema({
  productId: { type: Number, unique: true, required: true },
  name: String,
  description: String,
  ipfsHash: String,
  farmer: String,
  status: Number,
  priceHistory: Array,
  createdAt: Date,
  updatedAt: Date
});

const Product = mongoose.model('Product', productSchema);

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Register new product
app.post('/products', async (req, res) => {
  try {
    const { name, description, category, images, certifications, location, harvestDate, expiryDate, farmingMethod, nutritionalInfo } = req.body;

    // Validate required fields
    if (!name || !description || !category) {
      return res.status(400).json({ error: 'Name, description, and category are required' });
    }

    // Create product metadata
    const productData = ipfsService.createProductMetadata({
      name,
      description,
      category,
      images,
      certifications,
      location,
      harvestDate,
      expiryDate,
      farmingMethod,
      nutritionalInfo
    });

    // Pin to IPFS
    const ipfsResult = await ipfsService.pinJSON(productData, {
      name: `Product: ${name}`,
      keyvalues: {
        category: category,
        farmer: req.body.farmerAddress || 'unknown'
      }
    });

    // Register on blockchain
    const tx = await contract.registerProduct(name, description, ipfsResult.hash);
    const receipt = await tx.wait();

    // Extract product ID from event
    const event = receipt.logs.find(log => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed.name === 'ProductRegistered';
      } catch (e) {
        return false;
      }
    });

    const productId = event ? Number(contract.interface.parseLog(event).args.productId) : null;

    // Cache in MongoDB if available
    if (mongoose.connection.readyState === 1 && productId) {
      try {
        await Product.create({
          productId,
          name,
          description,
          ipfsHash: ipfsResult.hash,
          farmer: wallet.address,
          status: 0,
          priceHistory: [],
          createdAt: new Date(),
          updatedAt: new Date()
        });
      } catch (cacheError) {
        console.warn('Cache update failed:', cacheError.message);
      }
    }

    res.status(201).json({
      success: true,
      productId,
      ipfsHash: ipfsResult.hash,
      ipfsUrl: ipfsResult.url,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber
    });

  } catch (error) {
    console.error('Product registration failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update product status/price
app.post('/products/:id/transition', async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const { action, status, price } = req.body;

    if (!action || (action !== 'status' && action !== 'price')) {
      return res.status(400).json({ error: 'Action must be either "status" or "price"' });
    }

    let tx, receipt;

    if (action === 'status') {
      if (status === undefined || status < 0 || status > 3) {
        return res.status(400).json({ error: 'Invalid status value (0-3)' });
      }
      tx = await contract.updateStatus(productId, status);
    } else if (action === 'price') {
      if (!price || price <= 0) {
        return res.status(400).json({ error: 'Price must be greater than 0' });
      }
      const priceWei = ethers.parseEther(price.toString());
      tx = await contract.updatePrice(productId, priceWei);
    }

    receipt = await tx.wait();

    // Update cache if available
    if (mongoose.connection.readyState === 1) {
      try {
        const updateData = { updatedAt: new Date() };
        if (action === 'status') updateData.status = status;
        
        await Product.findOneAndUpdate({ productId }, updateData);
      } catch (cacheError) {
        console.warn('Cache update failed:', cacheError.message);
      }
    }

    res.json({
      success: true,
      action,
      productId,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber
    });

  } catch (error) {
    console.error('Product transition failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get product details
app.get('/products/:id', async (req, res) => {
  try {
    const productId = parseInt(req.params.id);

    // Try cache first
    let cachedProduct = null;
    if (mongoose.connection.readyState === 1) {
      try {
        cachedProduct = await Product.findOne({ productId });
      } catch (cacheError) {
        console.warn('Cache read failed:', cacheError.message);
      }
    }

    // Get from blockchain
    const product = await contract.getProduct(productId);
    const priceHistory = await contract.getPriceHistory(productId);

    // Get IPFS metadata
    let ipfsData = null;
    try {
      ipfsData = await ipfsService.getJSON(product.ipfsHash);
    } catch (ipfsError) {
      console.warn('IPFS read failed:', ipfsError.message);
    }

    // Format price history
    const formattedPriceHistory = priceHistory.map(record => ({
      price: ethers.formatEther(record.price),
      updatedBy: record.updatedBy,
      timestamp: new Date(Number(record.timestamp) * 1000).toISOString(),
      statusAtTime: Number(record.statusAtTime)
    }));

    const response = {
      id: Number(product.id),
      name: product.name,
      description: product.description,
      ipfsHash: product.ipfsHash,
      farmer: product.farmer,
      status: Number(product.status),
      statusText: ['Registered', 'InTransit', 'Distributed', 'Sold'][Number(product.status)],
      createdAt: new Date(Number(product.createdAt) * 1000).toISOString(),
      updatedAt: new Date(Number(product.updatedAt) * 1000).toISOString(),
      priceHistory: formattedPriceHistory,
      metadata: ipfsData,
      cached: !!cachedProduct
    };

    res.json(response);

  } catch (error) {
    console.error('Product fetch failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get product history/timeline
app.get('/products/:id/history', async (req, res) => {
  try {
    const productId = parseInt(req.params.id);

    // Get product and price history
    const product = await contract.getProduct(productId);
    const priceHistory = await contract.getPriceHistory(productId);

    // Create timeline combining status changes and price updates
    const timeline = [];

    // Add registration event
    timeline.push({
      type: 'registration',
      timestamp: new Date(Number(product.createdAt) * 1000).toISOString(),
      actor: product.farmer,
      data: {
        name: product.name,
        description: product.description
      }
    });

    // Add price history events
    priceHistory.forEach(record => {
      timeline.push({
        type: 'price_update',
        timestamp: new Date(Number(record.timestamp) * 1000).toISOString(),
        actor: record.updatedBy,
        data: {
          price: ethers.formatEther(record.price),
          statusAtTime: Number(record.statusAtTime)
        }
      });
    });

    // Sort by timestamp
    timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    res.json({
      productId,
      timeline,
      currentStatus: Number(product.status),
      totalEvents: timeline.length
    });

  } catch (error) {
    console.error('History fetch failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all products (with pagination)
app.get('/products', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const farmer = req.query.farmer;

    let productIds;
    if (farmer) {
      productIds = await contract.getProductsByFarmer(farmer);
    } else {
      productIds = await contract.getAllProducts();
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedIds = productIds.slice(startIndex, endIndex);

    // Get product details
    const products = await Promise.all(
      paginatedIds.map(async (id) => {
        try {
          const product = await contract.getProduct(Number(id));
          return {
            id: Number(product.id),
            name: product.name,
            description: product.description,
            farmer: product.farmer,
            status: Number(product.status),
            statusText: ['Registered', 'InTransit', 'Distributed', 'Sold'][Number(product.status)],
            createdAt: new Date(Number(product.createdAt) * 1000).toISOString()
          };
        } catch (error) {
          console.warn(`Failed to fetch product ${id}:`, error.message);
          return null;
        }
      })
    );

    res.json({
      products: products.filter(p => p !== null),
      pagination: {
        page,
        limit,
        total: productIds.length,
        pages: Math.ceil(productIds.length / limit)
      }
    });

  } catch (error) {
    console.error('Products fetch failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Supply Chain API running on port ${PORT}`);
  console.log(`Contract Address: ${process.env.CONTRACT_ADDRESS}`);
  console.log(`Network: ${process.env.POLYGON_RPC_URL}`);
});
