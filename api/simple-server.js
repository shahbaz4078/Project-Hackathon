const express = require('express');
const cors = require('cors');
const AIModels = require('./ai-models');

const app = express();
const PORT = process.env.PORT || 3001;
const aiModels = new AIModels();

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage with sample products
let products = [
  {
    productId: 1,
    name: 'Organic Tomatoes',
    description: 'Fresh organic tomatoes grown without pesticides in Maharashtra farms',
    category: 'Vegetables',
    harvestDate: '2025-01-15',
    location: 'Maharashtra, India',
    farmingMethod: 'organic',
    farmerAddress: '0x1234...5678',
    status: 'Fresh',
    timestamp: '2025-01-16T10:00:00Z',
    transactionHash: '0xabc123def456...',
    predictedPrice: 75,
    currency: 'INR'
  },
  {
    productId: 2,
    name: 'Free Range Eggs',
    description: 'Farm-fresh eggs from free-range chickens in Punjab',
    category: 'Dairy',
    harvestDate: '2025-01-10',
    location: 'Punjab, India',
    farmingMethod: 'conventional',
    farmerAddress: '0x2345...6789',
    status: 'Available',
    timestamp: '2025-01-11T08:30:00Z',
    transactionHash: '0xdef456ghi789...',
    predictedPrice: 85,
    currency: 'INR'
  },
  {
    productId: 3,
    name: 'Grass Fed Beef',
    description: 'Premium quality grass-fed beef from Haryana farms',
    category: 'Meat',
    harvestDate: '2025-01-05',
    location: 'Haryana, India',
    farmingMethod: 'organic',
    farmerAddress: '0x3456...7890',
    status: 'Premium',
    timestamp: '2025-01-06T14:15:00Z',
    transactionHash: '0xghi789jkl012...',
    predictedPrice: 650,
    currency: 'INR'
  },
  {
    productId: 4,
    name: 'Organic Apples',
    description: 'Sweet and crispy organic apples from Himachal Pradesh orchards',
    category: 'Fruits',
    harvestDate: '2025-01-20',
    location: 'Himachal Pradesh, India',
    farmingMethod: 'organic',
    farmerAddress: '0x4567...8901',
    status: 'Seasonal',
    timestamp: '2025-01-21T12:00:00Z',
    transactionHash: '0xjkl012mno345...',
    predictedPrice: 120,
    currency: 'INR'
  },
  {
    productId: 5,
    name: 'Basmati Rice',
    description: 'Premium quality Basmati rice from Punjab fields',
    category: 'Grains',
    harvestDate: '2024-12-15',
    location: 'Punjab, India',
    farmingMethod: 'conventional',
    farmerAddress: '0x5678...9012',
    status: 'Available',
    timestamp: '2024-12-16T09:45:00Z',
    transactionHash: '0xmno345pqr678...',
    predictedPrice: 55,
    currency: 'INR'
  },
  {
    productId: 6,
    name: 'Organic Spinach',
    description: 'Fresh organic spinach leaves grown hydroponically',
    category: 'Vegetables',
    harvestDate: '2025-01-18',
    location: 'Karnataka, India',
    farmingMethod: 'hydroponic',
    farmerAddress: '0x6789...0123',
    status: 'Fresh',
    timestamp: '2025-01-19T07:20:00Z',
    transactionHash: '0xpqr678stu901...',
    predictedPrice: 45,
    currency: 'INR'
  }
];

let nextId = 7;

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Register new product (with AI analysis)
app.post('/products', async (req, res) => {
  try {
    const { name, description, category, harvestDate, location, farmingMethod, farmerAddress } = req.body;

    // Validate required fields
    if (!name || !description || !category) {
      return res.status(400).json({ error: 'Name, description, and category are required' });
    }

    // Get AI predictions
    const priceAnalysis = aiModels.predictPrice(category, farmingMethod, location);
    const demandAnalysis = aiModels.forecastDemand(category);
    
    // Create product with AI analysis
    const product = {
      productId: nextId++,
      name,
      description,
      category,
      harvestDate,
      location,
      farmingMethod,
      farmerAddress,
      status: 'Registered',
      timestamp: new Date().toISOString(),
      transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
      // AI Analysis
      predictedPrice: priceAnalysis.predictedPrice,
      priceConfidence: priceAnalysis.confidence,
      priceTrend: priceAnalysis.trend,
      demandForecast: demandAnalysis.forecastedDemand,
      demandLevel: demandAnalysis.demandLevel,
      currency: 'INR'
    };

    // Fraud detection
    const fraudAnalysis = aiModels.detectFraud({
      ...product,
      price: priceAnalysis.predictedPrice
    });
    
    product.fraudScore = fraudAnalysis.fraudScore;
    product.riskLevel = fraudAnalysis.riskLevel;
    product.fraudFlags = fraudAnalysis.flags;

    products.push(product);

    res.status(201).json({
      success: true,
      productId: product.productId,
      transactionHash: product.transactionHash,
      aiAnalysis: {
        predictedPrice: `₹${priceAnalysis.predictedPrice}`,
        priceConfidence: `${Math.round(priceAnalysis.confidence * 100)}%`,
        priceTrend: priceAnalysis.trend,
        demandForecast: demandAnalysis.forecastedDemand,
        demandLevel: demandAnalysis.demandLevel,
        fraudScore: fraudAnalysis.fraudScore,
        riskLevel: fraudAnalysis.riskLevel
      },
      message: 'Product registered successfully with AI analysis'
    });

  } catch (error) {
    console.error('Product registration failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get product by ID (with AI analysis)
app.get('/products/:id', (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    let product = products.find(p => p.productId === productId);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Add real-time AI analysis
    const aiAnalysis = aiModels.getComprehensiveAnalysis(product);
    product.aiAnalysis = aiAnalysis;

    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get AI analysis for a product
app.get('/products/:id/ai-analysis', (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const product = products.find(p => p.productId === productId);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const analysis = aiModels.getComprehensiveAnalysis(product);
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get market insights
app.get('/market-insights', (req, res) => {
  try {
    const { category } = req.query;
    
    const insights = {
      priceAnalysis: aiModels.predictPrice(category || 'Vegetables'),
      demandForecast: aiModels.forecastDemand(category || 'Vegetables'),
      marketTrends: {
        topCategories: ['Vegetables', 'Fruits', 'Dairy'],
        priceVolatility: 'Medium',
        seasonalFactors: 'High impact in winter months'
      },
      currency: 'INR',
      timestamp: new Date().toISOString()
    };

    res.json(insights);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all products
app.get('/products', (req, res) => {
  const productsWithPrices = products.map(product => ({
    ...product,
    displayPrice: `₹${product.predictedPrice || 'N/A'}`
  }));
  res.json(productsWithPrices);
});

app.listen(PORT, () => {
  console.log(`AI-powered server running on port ${PORT}`);
  console.log(`Loaded ${products.length} sample products`);
  console.log('Features: Price Prediction, Fraud Detection, Demand Forecasting');
});
