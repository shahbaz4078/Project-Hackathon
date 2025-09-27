const axios = require('axios');
const FormData = require('form-data');

class IPFSService {
  constructor(config = {}) {
    this.provider = config.provider || 'pinata';
    this.apiKey = config.apiKey || process.env.IPFS_API_KEY;
    this.secret = config.secret || process.env.IPFS_SECRET;
    this.gateway = config.gateway || 'https://gateway.pinata.cloud/ipfs/';
  }

  async pinJSON(data, metadata = {}) {
    try {
      // Validate JSON schema
      this.validateProductSchema(data);

      if (this.provider === 'pinata') {
        return await this.pinToPinata(data, metadata);
      } else {
        throw new Error(`Unsupported IPFS provider: ${this.provider}`);
      }
    } catch (error) {
      console.error('IPFS pinning failed:', error);
      throw error;
    }
  }

  async pinToPinata(data, metadata) {
    const url = 'https://api.pinata.cloud/pinning/pinJSONToIPFS';
    
    const body = {
      pinataContent: data,
      pinataMetadata: {
        name: metadata.name || 'Product Data',
        keyvalues: metadata.keyvalues || {}
      }
    };

    const headers = {
      'Content-Type': 'application/json',
      'pinata_api_key': this.apiKey,
      'pinata_secret_api_key': this.secret
    };

    const response = await axios.post(url, body, { headers });
    
    if (response.status === 200) {
      return {
        success: true,
        hash: response.data.IpfsHash,
        url: `${this.gateway}${response.data.IpfsHash}`,
        size: response.data.PinSize,
        timestamp: response.data.Timestamp
      };
    } else {
      throw new Error(`Pinata API error: ${response.status}`);
    }
  }

  async getJSON(hash) {
    try {
      const url = `${this.gateway}${hash}`;
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('IPFS retrieval failed:', error);
      throw error;
    }
  }

  validateProductSchema(data) {
    const requiredFields = ['name', 'description', 'category'];
    const optionalFields = ['images', 'certifications', 'location', 'harvestDate', 'expiryDate'];
    
    // Check required fields
    for (const field of requiredFields) {
      if (!data[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate data types
    if (typeof data.name !== 'string' || data.name.length === 0) {
      throw new Error('Name must be a non-empty string');
    }

    if (typeof data.description !== 'string' || data.description.length === 0) {
      throw new Error('Description must be a non-empty string');
    }

    if (typeof data.category !== 'string' || data.category.length === 0) {
      throw new Error('Category must be a non-empty string');
    }

    // Validate optional fields if present
    if (data.images && !Array.isArray(data.images)) {
      throw new Error('Images must be an array');
    }

    if (data.harvestDate && !this.isValidDate(data.harvestDate)) {
      throw new Error('Invalid harvest date format');
    }

    if (data.expiryDate && !this.isValidDate(data.expiryDate)) {
      throw new Error('Invalid expiry date format');
    }

    return true;
  }

  isValidDate(dateString) {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  }

  // Utility method to create product metadata
  createProductMetadata(productData) {
    return {
      name: productData.name,
      description: productData.description,
      category: productData.category,
      images: productData.images || [],
      certifications: productData.certifications || [],
      location: productData.location || {},
      harvestDate: productData.harvestDate,
      expiryDate: productData.expiryDate,
      nutritionalInfo: productData.nutritionalInfo || {},
      farmingMethod: productData.farmingMethod || 'conventional',
      createdAt: new Date().toISOString(),
      version: '1.0'
    };
  }
}

module.exports = IPFSService;
