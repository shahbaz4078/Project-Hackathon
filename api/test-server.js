const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Simple products data
const products = {
  1: { productId: 1, name: 'Organic Tomatoes', status: 'Fresh', category: 'Vegetables', location: 'Maharashtra, India', predictedPrice: 75 },
  2: { productId: 2, name: 'Free Range Eggs', status: 'Available', category: 'Dairy', location: 'Punjab, India', predictedPrice: 85 },
  3: { productId: 3, name: 'Grass Fed Beef', status: 'Premium', category: 'Meat', location: 'Haryana, India', predictedPrice: 650 },
  4: { productId: 4, name: 'Organic Apples', status: 'Seasonal', category: 'Fruits', location: 'Himachal Pradesh, India', predictedPrice: 120 }
};

app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

app.get('/products/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const product = products[id];
  
  if (product) {
    res.json(product);
  } else {
    res.status(404).json({ error: 'Product not found' });
  }
});

app.post('/products', (req, res) => {
  const newId = Object.keys(products).length + 1;
  const product = {
    productId: newId,
    ...req.body,
    predictedPrice: 50 + Math.floor(Math.random() * 100)
  };
  
  products[newId] = product;
  
  res.json({
    success: true,
    productId: newId,
    transactionHash: '0x' + Math.random().toString(16).substr(2, 64)
  });
});

app.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
  console.log('Available products: 1, 2, 3, 4');
});
